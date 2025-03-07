import {
  DistributedTransaction,
  DistributedTransactionType,
  IDistributedSchedulerStorage,
  IDistributedTransactionStorage,
  SchedulerOptions,
  SkipExecutionError,
  TransactionCheckpoint,
  TransactionFlow,
  TransactionOptions,
  TransactionStep,
} from "@medusajs/framework/orchestration"
import { Logger, ModulesSdkTypes } from "@medusajs/framework/types"
import {
  MedusaError,
  promiseAll,
  TransactionState,
  TransactionStepState,
} from "@medusajs/framework/utils"
import { WorkflowOrchestratorService } from "@services"
import { Queue, Worker } from "bullmq"
import Redis from "ioredis"

enum JobType {
  SCHEDULE = "schedule",
  RETRY = "retry",
  STEP_TIMEOUT = "step_timeout",
  TRANSACTION_TIMEOUT = "transaction_timeout",
}

export class RedisDistributedTransactionStorage
  implements IDistributedTransactionStorage, IDistributedSchedulerStorage
{
  private static TTL_AFTER_COMPLETED = 60 * 2 // 2 minutes
  private workflowExecutionService_: ModulesSdkTypes.IMedusaInternalService<any>
  private logger_: Logger
  private workflowOrchestratorService_: WorkflowOrchestratorService

  private redisClient: Redis
  private redisWorkerConnection: Redis
  private queueName: string
  private jobQueueName: string
  private queue: Queue
  private jobQueue?: Queue
  private worker: Worker
  private jobWorker?: Worker

  #isWorkerMode: boolean = false

  constructor({
    workflowExecutionService,
    redisConnection,
    redisWorkerConnection,
    redisQueueName,
    redisJobQueueName,
    logger,
    isWorkerMode,
  }: {
    workflowExecutionService: ModulesSdkTypes.IMedusaInternalService<any>
    redisConnection: Redis
    redisWorkerConnection: Redis
    redisQueueName: string
    redisJobQueueName: string
    logger: Logger
    isWorkerMode: boolean
  }) {
    this.workflowExecutionService_ = workflowExecutionService
    this.logger_ = logger
    this.redisClient = redisConnection
    this.redisWorkerConnection = redisWorkerConnection
    this.queueName = redisQueueName
    this.jobQueueName = redisJobQueueName
    this.queue = new Queue(redisQueueName, { connection: this.redisClient })
    this.jobQueue = isWorkerMode
      ? new Queue(redisJobQueueName, {
          connection: this.redisClient,
        })
      : undefined
    this.#isWorkerMode = isWorkerMode
  }

  async onApplicationPrepareShutdown() {
    // Close worker gracefully, i.e. wait for the current jobs to finish
    await this.worker?.close()
    await this.jobWorker?.close()
  }

  async onApplicationShutdown() {
    await this.queue?.close()
    await this.jobQueue?.close()
  }

  async onApplicationStart() {
    const allowedJobs = [
      JobType.RETRY,
      JobType.STEP_TIMEOUT,
      JobType.TRANSACTION_TIMEOUT,
    ]

    const workerOptions = {
      connection:
        this.redisWorkerConnection /*, runRetryDelay: 100000 for tests */,
    }

    this.worker = new Worker(
      this.queueName,
      async (job) => {
        if (allowedJobs.includes(job.name as JobType)) {
          await this.executeTransaction(
            job.data.workflowId,
            job.data.transactionId
          )
        }

        if (job.name === JobType.SCHEDULE) {
          // Remove repeatable job from the old queue since now we have a queue dedicated to scheduled jobs
          await this.remove(job.data.jobId)
        }
      },
      workerOptions
    )

    if (this.#isWorkerMode) {
      this.jobWorker = new Worker(
        this.jobQueueName,
        async (job) => {
          await this.executeScheduledJob(
            job.data.jobId,
            job.data.schedulerOptions
          )
        },
        workerOptions
      )
    }
  }

  setWorkflowOrchestratorService(workflowOrchestratorService) {
    this.workflowOrchestratorService_ = workflowOrchestratorService
  }

  private async saveToDb(data: TransactionCheckpoint, retentionTime?: number) {
    await this.workflowExecutionService_.upsert([
      {
        workflow_id: data.flow.modelId,
        transaction_id: data.flow.transactionId,
        execution: data.flow,
        context: {
          data: data.context,
          errors: data.errors,
        },
        state: data.flow.state,
        retention_time: retentionTime,
      },
    ])
  }

  private async deleteFromDb(data: TransactionCheckpoint) {
    await this.workflowExecutionService_.delete([
      {
        workflow_id: data.flow.modelId,
        transaction_id: data.flow.transactionId,
      },
    ])
  }

  private async executeTransaction(workflowId: string, transactionId: string) {
    return await this.workflowOrchestratorService_.run(workflowId, {
      transactionId,
      logOnError: true,
      throwOnError: false,
    })
  }

  private async executeScheduledJob(
    jobId: string,
    schedulerOptions: SchedulerOptions
  ) {
    try {
      // TODO: In the case of concurrency being forbidden, we want to generate a predictable transaction ID and rely on the idempotency
      // of the transaction to ensure that the transaction is only executed once.
      return await this.workflowOrchestratorService_.run(jobId, {
        logOnError: true,
        throwOnError: false,
      })
    } catch (e) {
      if (e instanceof MedusaError && e.type === MedusaError.Types.NOT_FOUND) {
        this.logger_?.warn(
          `Tried to execute a scheduled workflow with ID ${jobId} that does not exist, removing it from the scheduler.`
        )

        await this.remove(jobId)
        return
      }

      throw e
    }
  }

  async get(
    key: string,
    options?: TransactionOptions
  ): Promise<TransactionCheckpoint | undefined> {
    const data = await this.redisClient.get(key)

    if (data) {
      return JSON.parse(data)
    }

    const { idempotent } = options ?? {}
    if (!idempotent) {
      return
    }

    const [_, workflowId, transactionId] = key.split(":")
    const trx = await this.workflowExecutionService_
      .retrieve(
        {
          workflow_id: workflowId,
          transaction_id: transactionId,
        },
        {
          select: ["execution", "context"],
        }
      )
      .catch(() => undefined)

    if (trx) {
      return {
        flow: trx.execution,
        context: trx.context.data,
        errors: trx.context.errors,
      }
    }
    return
  }

  async list(): Promise<TransactionCheckpoint[]> {
    const keys = await this.redisClient.keys(
      DistributedTransaction.keyPrefix + ":*"
    )
    const transactions: any[] = []
    for (const key of keys) {
      const data = await this.redisClient.get(key)
      if (data) {
        transactions.push(JSON.parse(data))
      }
    }
    return transactions
  }

  async save(
    key: string,
    data: TransactionCheckpoint,
    ttl?: number,
    options?: TransactionOptions
  ): Promise<void> {
    /**
     * Store the retention time only if the transaction is done, failed or reverted.
     * From that moment, this tuple can be later on archived or deleted after the retention time.
     */
    const hasFinished = [
      TransactionState.DONE,
      TransactionState.FAILED,
      TransactionState.REVERTED,
    ].includes(data.flow.state)

    const { retentionTime, idempotent } = options ?? {}

    await this.#preventRaceConditionExecutionIfNecessary({
      data,
      key,
    })

    if (hasFinished) {
      Object.assign(data, {
        retention_time: retentionTime,
      })
    }

    const stringifiedData = JSON.stringify(data)

    if (!hasFinished) {
      if (ttl) {
        await this.redisClient.set(key, stringifiedData, "EX", ttl)
      } else {
        await this.redisClient.set(key, stringifiedData)
      }
    }

    if (hasFinished && !retentionTime && !idempotent) {
      await this.deleteFromDb(data)
    } else {
      await this.saveToDb(data, retentionTime)
    }

    if (hasFinished) {
      await this.redisClient.set(
        key,
        stringifiedData,
        "EX",
        RedisDistributedTransactionStorage.TTL_AFTER_COMPLETED
      )
    }
  }

  async scheduleRetry(
    transaction: DistributedTransactionType,
    step: TransactionStep,
    timestamp: number,
    interval: number
  ): Promise<void> {
    await this.queue.add(
      JobType.RETRY,
      {
        workflowId: transaction.modelId,
        transactionId: transaction.transactionId,
        stepId: step.id,
      },
      {
        delay: interval > 0 ? interval * 1000 : undefined,
        jobId: this.getJobId(JobType.RETRY, transaction, step),
        removeOnComplete: true,
      }
    )
  }

  async clearRetry(
    transaction: DistributedTransactionType,
    step: TransactionStep
  ): Promise<void> {
    await this.removeJob(JobType.RETRY, transaction, step)
  }

  async scheduleTransactionTimeout(
    transaction: DistributedTransactionType,
    _: number,
    interval: number
  ): Promise<void> {
    await this.queue.add(
      JobType.TRANSACTION_TIMEOUT,
      {
        workflowId: transaction.modelId,
        transactionId: transaction.transactionId,
      },
      {
        delay: interval * 1000,
        jobId: this.getJobId(JobType.TRANSACTION_TIMEOUT, transaction),
        removeOnComplete: true,
      }
    )
  }

  async clearTransactionTimeout(
    transaction: DistributedTransactionType
  ): Promise<void> {
    await this.removeJob(JobType.TRANSACTION_TIMEOUT, transaction)
  }

  async scheduleStepTimeout(
    transaction: DistributedTransactionType,
    step: TransactionStep,
    timestamp: number,
    interval: number
  ): Promise<void> {
    await this.queue.add(
      JobType.STEP_TIMEOUT,
      {
        workflowId: transaction.modelId,
        transactionId: transaction.transactionId,
        stepId: step.id,
      },
      {
        delay: interval * 1000,
        jobId: this.getJobId(JobType.STEP_TIMEOUT, transaction, step),
        removeOnComplete: true,
      }
    )
  }

  async clearStepTimeout(
    transaction: DistributedTransactionType,
    step: TransactionStep
  ): Promise<void> {
    await this.removeJob(JobType.STEP_TIMEOUT, transaction, step)
  }

  private getJobId(
    type: JobType,
    transaction: DistributedTransactionType,
    step?: TransactionStep
  ) {
    const key = [type, transaction.modelId, transaction.transactionId]

    if (step) {
      key.push(step.id, step.attempts + "")
      if (step.isCompensating()) {
        key.push("compensate")
      }
    }

    return key.join(":")
  }

  private async removeJob(
    type: JobType,
    transaction: DistributedTransactionType,
    step?: TransactionStep
  ) {
    const jobId = this.getJobId(type, transaction, step)

    if (type === JobType.SCHEDULE) {
      const job = await this.jobQueue?.getJob(jobId)
      if (job) {
        await job.remove()
      }
    } else {
      const job = await this.queue.getJob(jobId)

      if (job && job.attemptsStarted === 0) {
        await job.remove()
      }
    }
  }

  /* Scheduler storage methods */
  async schedule(
    jobDefinition: string | { jobId: string },
    schedulerOptions: SchedulerOptions
  ): Promise<void> {
    const jobId =
      typeof jobDefinition === "string" ? jobDefinition : jobDefinition.jobId

    // If it is the same key (eg. the same workflow name), the old one will get overridden.
    await this.jobQueue?.add(
      JobType.SCHEDULE,
      {
        jobId,
        schedulerOptions,
      },
      {
        repeat: {
          pattern: schedulerOptions.cron,
          limit: schedulerOptions.numberOfExecutions,
          key: `${JobType.SCHEDULE}_${jobId}`,
        },
        removeOnComplete: {
          age: 86400,
          count: 1000,
        },
        removeOnFail: {
          age: 604800,
          count: 5000,
        },
      }
    )
  }

  async remove(jobId: string): Promise<void> {
    await this.jobQueue?.removeRepeatableByKey(`${JobType.SCHEDULE}_${jobId}`)
  }

  async removeAll(): Promise<void> {
    const repeatableJobs = (await this.jobQueue?.getRepeatableJobs()) ?? []
    await promiseAll(
      repeatableJobs.map((job) => this.jobQueue?.removeRepeatableByKey(job.key))
    )
  }

  async #preventRaceConditionExecutionIfNecessary({
    data,
    key,
  }: {
    data: TransactionCheckpoint
    key: string
  }) {
    /**
     * In case many execution can succeed simultaneously, we need to ensure that the latest
     * execution does continue if a previous execution is considered finished
     */
    const currentFlow = data.flow
    const { flow: latestUpdatedFlow } =
      (await this.get(key)) ?? ({ flow: {} } as { flow: TransactionFlow })

    const currentFlowLastInvokingStepIndex = Object.values(
      currentFlow.steps
    ).findIndex((step) => {
      return [
        TransactionStepState.INVOKING,
        TransactionStepState.NOT_STARTED,
      ].includes(step.invoke?.state)
    })

    const latestUpdatedFlowLastInvokingStepIndex = !latestUpdatedFlow.steps
      ? 1 // There is no other execution, so the current execution is the latest
      : Object.values(
          (latestUpdatedFlow.steps as Record<string, TransactionStep>) ?? {}
        ).findIndex((step) => {
          return [
            TransactionStepState.INVOKING,
            TransactionStepState.NOT_STARTED,
          ].includes(step.invoke?.state)
        })

    const currentFlowLastCompensatingStepIndex = Object.values(
      currentFlow.steps
    )
      .reverse()
      .findIndex((step) => {
        return [
          TransactionStepState.COMPENSATING,
          TransactionStepState.NOT_STARTED,
        ].includes(step.compensate?.state)
      })

    const latestUpdatedFlowLastCompensatingStepIndex = !latestUpdatedFlow.steps
      ? 1 // There is no other execution, so the current execution is the latest
      : Object.values(
          (latestUpdatedFlow.steps as Record<string, TransactionStep>) ?? {}
        )
          .reverse()
          .findIndex((step) => {
            return [
              TransactionStepState.COMPENSATING,
              TransactionStepState.NOT_STARTED,
            ].includes(step.compensate?.state)
          })

    const isLatestExecutionFinishedIndex = -1
    const invokeShouldBeSkipped =
      (latestUpdatedFlowLastInvokingStepIndex ===
        isLatestExecutionFinishedIndex ||
        currentFlowLastInvokingStepIndex <
          latestUpdatedFlowLastInvokingStepIndex) &&
      currentFlowLastInvokingStepIndex !== isLatestExecutionFinishedIndex

    const compensateShouldBeSkipped =
      (latestUpdatedFlowLastCompensatingStepIndex ===
        isLatestExecutionFinishedIndex ||
        currentFlowLastCompensatingStepIndex <
          latestUpdatedFlowLastCompensatingStepIndex) &&
      currentFlowLastCompensatingStepIndex !== isLatestExecutionFinishedIndex

    if (
      (data.flow.state !== TransactionState.COMPENSATING &&
        invokeShouldBeSkipped) ||
      (data.flow.state === TransactionState.COMPENSATING &&
        compensateShouldBeSkipped) ||
      (latestUpdatedFlow.state === TransactionState.COMPENSATING &&
        currentFlow.state !== latestUpdatedFlow.state)
    ) {
      throw new SkipExecutionError("already finished by another execution")
    }
  }
}
