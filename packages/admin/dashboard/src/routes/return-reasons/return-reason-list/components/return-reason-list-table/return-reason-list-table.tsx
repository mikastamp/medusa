import { PencilSquare, Trash } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import {
  Badge,
  Container,
  createDataTableColumnHelper,
  DataTableEmptyStateProps,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { DataTable } from "../../../../../components/data-table"
import { useDataTableDateFilters } from "../../../../../components/data-table/hooks/general/use-data-table-date-filters"
import {
  useDeleteReturnReasonLazy,
  useReturnReasons,
} from "../../../../../hooks/api/return-reasons"
import { useQueryParams } from "../../../../../hooks/use-query-params"

const PAGE_SIZE = 20

export const ReturnReasonListTable = () => {
  const { t } = useTranslation()
  const searchParams = useReturnReasonTableQuery({
    pageSize: PAGE_SIZE,
  })

  const { return_reasons, count, isPending, isError, error } = useReturnReasons(
    searchParams,
    {
      placeholderData: keepPreviousData,
    }
  )

  const columns = useColumns()
  const filters = useFilters()
  const emptyState = useEmptyState()
  if (isError) {
    throw error
  }

  return (
    <Container className="px-0 py-0">
      <DataTable
        data={return_reasons}
        columns={columns}
        filters={filters}
        getRowId={(row) => row.id}
        heading={t("returnReasons.domain")}
        // subtitle={t("returnReasons.subtitle")}
        action={{
          label: t("actions.create"),
          to: "create",
        }}
        rowCount={count}
        isLoading={isPending}
        pageSize={PAGE_SIZE}
        emptyState={emptyState}
      />
    </Container>
  )
}

const useEmptyState = (): DataTableEmptyStateProps => {
  const { t } = useTranslation()

  return {
    empty: {
      heading: t("returnReasons.list.empty.heading"),
      description: t("returnReasons.list.empty.description"),
    },
    filtered: {
      heading: t("returnReasons.list.filtered.heading"),
      description: t("returnReasons.list.filtered.description"),
    },
  }
}

const useReturnReasonTableQuery = ({
  pageSize,
  prefix,
}: {
  pageSize: number
  prefix?: string
}) => {
  const { offset, q, order, created_at, updated_at } = useQueryParams(
    ["offset", "q", "order", "created_at", "updated_at"],
    prefix
  )

  const searchParams: HttpTypes.AdminReturnReasonListParams = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    order,
    created_at: created_at ? JSON.parse(created_at) : undefined,
    updated_at: updated_at ? JSON.parse(updated_at) : undefined,
    q,
  }

  return searchParams
}

const useFilters = () => {
  const dateFilters = useDataTableDateFilters()

  return dateFilters
}

const columnHelper = createDataTableColumnHelper<HttpTypes.AdminReturnReason>()

const useColumns = () => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const navigate = useNavigate()

  const { mutateAsync } = useDeleteReturnReasonLazy()

  const handleDelete = useCallback(
    async (returnReason: HttpTypes.AdminReturnReason) => {
      const result = await prompt({
        title: t("general.areYouSure"),
        description: t("returnReasons.delete.confirmation", {
          label: returnReason.label,
        }),
        confirmText: t("actions.delete"),
        cancelText: t("actions.cancel"),
      })

      if (!result) {
        return
      }

      await mutateAsync(returnReason.id, {
        onSuccess: () => {
          toast.success(
            t("returnReasons.delete.successToast", {
              label: returnReason.label,
            })
          )
        },
        onError: (e) => {
          toast.error(e.message)
        },
      })
    },
    [mutateAsync, prompt, t]
  )

  return useMemo(
    () => [
      columnHelper.accessor("label", {
        header: t("fields.label"),
        enableSorting: true,
        sortLabel: t("fields.label"),
        sortAscLabel: t("filters.sorting.alphabeticallyAsc"),
        sortDescLabel: t("filters.sorting.alphabeticallyDesc"),
      }),
      columnHelper.accessor("value", {
        header: t("fields.value"),
        cell: ({ getValue }) => <Badge size="2xsmall">{getValue()}</Badge>,
        enableSorting: true,
        sortLabel: t("fields.value"),
        sortAscLabel: t("filters.sorting.alphabeticallyAsc"),
        sortDescLabel: t("filters.sorting.alphabeticallyDesc"),
      }),
      columnHelper.accessor("description", {
        header: t("fields.description"),
        enableSorting: true,
        sortLabel: t("fields.description"),
        sortAscLabel: t("filters.sorting.alphabeticallyAsc"),
        sortDescLabel: t("filters.sorting.alphabeticallyDesc"),
        maxSize: 250,
      }),
      columnHelper.action({
        actions: (ctx) => {
          return [
            [
              {
                label: t("actions.edit"),
                onClick: () => navigate(`${ctx.row.original.id}/edit`),
                icon: <PencilSquare />,
              },
            ],
            [
              {
                label: t("actions.delete"),
                onClick: () => handleDelete(ctx.row.original),
                icon: <Trash />,
              },
            ],
          ]
        },
      }),
    ],
    [t, navigate, handleDelete]
  )
}
