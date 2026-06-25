"use client";

import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { type KeyboardEvent, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Invoice = {
  id: string;
  customer: string;
  status: string;
  method: string;
  amount: string;
};

type EditableInvoiceField = keyof Omit<Invoice, "id">;

type EditingCell = {
  invoiceId: string;
  field: EditableInvoiceField;
};

const initialInvoices: Invoice[] = [
  {
    id: "INV-001",
    customer: "Acme Corp",
    status: "Paid",
    method: "Credit Card",
    amount: "$250.00",
  },
  {
    id: "INV-002",
    customer: "Globex",
    status: "Pending",
    method: "Bank Transfer",
    amount: "$150.00",
  },
  {
    id: "INV-003",
    customer: "Umbrella",
    status: "Unpaid",
    method: "PayPal",
    amount: "$350.00",
  },
  {
    id: "INV-004",
    customer: "Initech",
    status: "Paid",
    method: "Credit Card",
    amount: "$450.00",
  },
];

const editableFields: Array<{
  key: EditableInvoiceField;
  label: string;
  align?: "right";
}> = [
  { key: "customer", label: "Customer" },
  { key: "status", label: "Status" },
  { key: "method", label: "Method" },
  { key: "amount", label: "Amount", align: "right" },
];

function parseAmount(amount: string) {
  return Number(amount.replace(/[^0-9.-]+/g, "")) || 0;
}

function formatTotal(invoices: Invoice[]) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(invoices.reduce((total, invoice) => total + parseAmount(invoice.amount), 0));
}

export default function TableDemoPage() {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [draftValue, setDraftValue] = useState("");
  const totalAmount = useMemo(() => formatTotal(invoices), [invoices]);

  function startEditing(invoice: Invoice, field: EditableInvoiceField) {
    setEditingCell({ invoiceId: invoice.id, field });
    setDraftValue(invoice[field]);
  }

  function saveEditing() {
    if (!editingCell) {
      return;
    }

    setInvoices((currentInvoices) =>
      currentInvoices.map((invoice) =>
        invoice.id === editingCell.invoiceId
          ? { ...invoice, [editingCell.field]: draftValue.trim() || invoice[editingCell.field] }
          : invoice,
      ),
    );
    setEditingCell(null);
    setDraftValue("");
  }

  function cancelEditing() {
    setEditingCell(null);
    setDraftValue("");
  }

  function handleEditKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      saveEditing();
    }

    if (event.key === "Escape") {
      cancelEditing();
    }
  }

  return (
    <main className="min-h-svh px-6 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              shadcn/ui table
            </p>
            <h1 className="text-3xl font-semibold tracking-normal">
              Invoice overview
            </h1>
          </div>
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft />
              Back home
            </Link>
          </Button>
        </div>

        <div className="flex items-center justify-between gap-4 bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
          <span>Click a cell to edit. Press Enter to save or Esc to cancel.</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setInvoices(initialInvoices);
              cancelEditing();
            }}
          >
            <RotateCcw />
            Reset
          </Button>
        </div>

        <div className="bg-card text-card-foreground">
          <Table>
            <TableCaption>Editable invoice payments. Click any data cell to update it.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                {editableFields.map((field) => (
                  <TableHead key={field.key} className={field.align === "right" ? "text-right" : undefined}>
                    {field.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  {editableFields.map((field) => {
                    const isEditing =
                      editingCell?.invoiceId === invoice.id && editingCell.field === field.key;

                    return (
                      <TableCell
                        key={`${invoice.id}-${field.key}`}
                        className={field.align === "right" ? "text-right" : undefined}
                      >
                        {isEditing ? (
                          <input
                            value={draftValue}
                            onChange={(event) => setDraftValue(event.target.value)}
                            onBlur={saveEditing}
                            onKeyDown={handleEditKeyDown}
                            autoFocus
                            className={
                              "h-8 w-full max-w-full rounded-md bg-background px-2 text-sm outline-none ring-1 ring-input focus-visible:ring-ring " +
                              (field.align === "right" ? "text-right" : "")
                            }
                            aria-label={`Edit ${field.label.toLowerCase()} for ${invoice.id}`}
                          />
                        ) : (
                          <button
                            type="button"
                            className={
                              "min-h-8 w-full rounded-md px-2 py-1 text-left text-sm transition-colors hover:bg-accent focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none " +
                              (field.align === "right" ? "text-right" : "")
                            }
                            onClick={() => startEditing(invoice, field.key)}
                          >
                            {field.key === "status" ? (
                              <span className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground">
                                {invoice[field.key]}
                              </span>
                            ) : (
                              invoice[field.key]
                            )}
                          </button>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4}>Total</TableCell>
                <TableCell className="text-right">{totalAmount}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>
    </main>
  );
}