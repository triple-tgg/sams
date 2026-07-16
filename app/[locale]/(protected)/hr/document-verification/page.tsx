"use client";

import React, { useState, useMemo } from "react";
import { useStaffDocumentTypes } from "@/lib/api/master/staff/staffDocumentTypes.hooks";
import { useStaffDocumentStatuses } from "@/lib/api/master/staff/staffDocumentStatuses.hooks";
import type { StaffDocumentType } from "@/lib/api/master/staff/staffDocumentTypes";
import type { StaffDocumentStatus } from "@/lib/api/master/staff/staffDocumentStatuses";
import { useVerificationList, useApproveDocument } from "@/lib/api/hr/documentVerification.hooks";
import type { VerificationDocument } from "@/lib/api/hr/documentVerification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  FileCheck,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  User,
  Download,
  RefreshCw,
  MoreHorizontal,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { color } from "@/lib/type";
import { toast } from "sonner";
import "../staff/hr-staff.css";

// ─── Status helpers ───
function getStatusColor(statusName: string | null): color {
  switch (statusName?.toLowerCase()) {
    case "approved":
      return "success";
    case "rejected":
      return "destructive";
    default:
      return "primary";
  }
}

const PER_PAGE = 20;

const DocumentVerificationPage = () => {
  // ─── Master data dropdowns ───
  const { data: docTypesResp } = useStaffDocumentTypes();
  const documentTypes = useMemo(() => {
    const raw = docTypesResp?.responseData ?? [];
    return raw.map((dt: StaffDocumentType) => ({ id: dt.id, label: dt.name }));
  }, [docTypesResp]);

  const { data: docStatusesResp } = useStaffDocumentStatuses();
  const statusOptions = useMemo(() => {
    const raw = docStatusesResp?.responseData ?? [];
    return raw.map((s: StaffDocumentStatus) => ({ id: s.id, label: s.name }));
  }, [docStatusesResp]);

  // Look up status IDs by code
  const statusIdMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of (docStatusesResp?.responseData ?? [])) {
      map[s.code.toLowerCase()] = s.id;
    }
    return map;
  }, [docStatusesResp]);

  // ─── Filter / search / pagination state ───
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDocTypeId, setFilterDocTypeId] = useState(0); // 0 = all
  const [filterStatusId, setFilterStatusId] = useState(0);   // 0 = all
  const [page, setPage] = useState(1);

  // ─── Verification list from API ───
  const {
    data: listResp,
    isLoading,
    refetch,
  } = useVerificationList({
    search: searchQuery,
    staffDocumentTypeId: filterDocTypeId,
    staffDocumentStatusId: filterStatusId,
    page,
    perPage: PER_PAGE,
  });

  const documents = listResp?.responseData ?? [];
  const totalRecords = listResp?.total ?? 0;
  const totalAll = listResp?.totalAll ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalRecords / PER_PAGE));

  // ─── Approve/Reject mutation ───
  const approveMutation = useApproveDocument();

  // ─── Dialog state ───
  const [previewDoc, setPreviewDoc] = useState<VerificationDocument | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{ docId: number; staffId: number } | null>(null);
  const [rejectRemark, setRejectRemark] = useState("");

  // ─── Handlers ───
  const handleApprove = (doc: VerificationDocument) => {
    const approvedStatusId = statusIdMap["approved"];
    if (!approvedStatusId) {
      toast.error("Cannot resolve 'Approved' status ID");
      return;
    }
    approveMutation.mutate(
      {
        staffId: doc.staffId,
        data: {
          documentId: doc.documentId,
          staffDocumentStatusId: approvedStatusId,
          rejectedReason: null,
        },
      },
      {
        onSuccess: () => {
          toast.success("Document approved");
          setPreviewDoc(null);
        },
        onError: (err) => toast.error(err.message || "Failed to approve"),
      },
    );
  };

  const openRejectDialog = (doc: VerificationDocument) => {
    setRejectTarget({ docId: doc.documentId, staffId: doc.staffId });
    setRejectRemark("");
  };

  const confirmReject = () => {
    if (!rejectTarget || !rejectRemark.trim()) return;
    const rejectedStatusId = statusIdMap["rejected"];
    if (!rejectedStatusId) {
      toast.error("Cannot resolve 'Rejected' status ID");
      return;
    }
    approveMutation.mutate(
      {
        staffId: rejectTarget.staffId,
        data: {
          documentId: rejectTarget.docId,
          staffDocumentStatusId: rejectedStatusId,
          rejectedReason: rejectRemark.trim(),
        },
      },
      {
        onSuccess: () => {
          toast.success("Document rejected");
          setRejectTarget(null);
          setRejectRemark("");
          setPreviewDoc(null);
        },
        onError: (err) => toast.error(err.message || "Failed to reject"),
      },
    );
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setFilterDocTypeId(0);
    setFilterStatusId(0);
    setPage(1);
    refetch();
    toast.info("Data refreshed");
  };

  // Reset to page 1 when filters change
  const handleDocTypeChange = (val: string) => {
    setFilterDocTypeId(Number(val));
    setPage(1);
  };
  const handleStatusChange = (val: string) => {
    setFilterStatusId(Number(val));
    setPage(1);
  };
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="hr-staff-page">
      <Card className="hr-staff-card">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <div className="flex items-center gap-3">
            <div className="hr-staff-icon-wrap">
              <FileCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Document Verification</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {totalAll} documents · showing {documents.length} of {totalRecords}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Search bar and Filters — same style as Staff List */}
          <div className="px-5 py-3 border-b bg-muted/30 flex flex-col lg:flex-row gap-3 items-center justify-between">
            <div className="relative w-full lg:max-w-sm shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-9 h-9"
              />
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
              <Select
                value={String(filterDocTypeId)}
                onValueChange={handleDocTypeChange}
              >
                <SelectTrigger className="h-9 min-w-[180px] bg-white text-xs">
                  <SelectValue placeholder="Document Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Document Types</SelectItem>
                  {documentTypes.map((dt: { id: number; label: string }) => (
                    <SelectItem key={dt.id} value={String(dt.id)}>
                      {dt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={String(filterStatusId)}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="h-9 min-w-[120px] bg-white text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Status</SelectItem>
                  {statusOptions.map((s: { id: number; label: string }) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                size="sm"
                variant="outline"
                onClick={handleRefresh}
                className="h-9"
              >
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap min-w-[220px]">
                  Employee Name
                </TableHead>
                <TableHead className="w-[200px]">Document</TableHead>
                <TableHead className="w-[130px] whitespace-nowrap">Uploaded</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[90px] text-center">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-12 text-muted-foreground"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : documents.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-12 text-muted-foreground"
                  >
                    {searchQuery
                      ? "No documents matching your search"
                      : "No documents found"}
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((doc: VerificationDocument) => (
                  <TableRow
                    key={doc.documentId}
                    className="cursor-pointer hover:bg-blue-50/50 transition-colors"
                    onClick={() => setPreviewDoc(doc)}
                  >
                    {/* Employee Name + Code */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-[34px] w-[34px] rounded-[10px] bg-muted flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {doc.title} {doc.employeeName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {doc.employeeId}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Document type */}
                    <TableCell className="text-sm">
                      {doc.documentTypeName ?? "—"}
                    </TableCell>

                    {/* Upload date */}
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(doc.uploadDate)}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge
                        color={getStatusColor(doc.statusName)}
                        className="text-xs"
                      >
                        {doc.statusName ?? "—"}
                      </Badge>
                    </TableCell>

                    {/* Action */}
                    <TableCell
                      className="text-center"
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-0.5">
                        {doc.filePath && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Preview file"
                            onClick={() => window.open(doc.filePath!, "_blank")}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setPreviewDoc(doc)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {doc.statusName?.toLowerCase() === "pending" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleApprove(doc)}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openRejectDialog(doc)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Footer — pagination */}
          <div className="flex items-center justify-between px-5 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages} · {totalRecords} results
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Document Preview Dialog ─── */}
      <Dialog
        open={!!previewDoc}
        onOpenChange={(open) => !open && setPreviewDoc(null)}
      >
        <DialogContent className="max-w-lg">
          {previewDoc && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Document Review
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {/* Staff info */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                  <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {previewDoc.title} {previewDoc.employeeName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {previewDoc.employeeId}
                    </p>
                  </div>
                </div>

                {/* Document details */}
                <div className="grid grid-cols-2 gap-4">
                  <DetailField
                    label="Document Type"
                    value={previewDoc.documentTypeName ?? "—"}
                  />
                  <DetailField
                    label="Upload Date"
                    value={formatDateTime(previewDoc.uploadDate)}
                  />
                  {/* File row with inline actions */}
                  <div className="col-span-2 flex items-center justify-between p-2.5 rounded-md border bg-muted/30">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">File</p>
                        <p className="text-sm font-medium truncate">{previewDoc.fileName ?? "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {previewDoc.filePath && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Preview in new tab"
                          onClick={() => window.open(previewDoc.filePath!, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Download"
                        disabled
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <DetailField
                    label="Status"
                    value={previewDoc.statusName ?? "—"}
                  />
                  {previewDoc.approvedBy && (
                    <DetailField
                      label="Approved By"
                      value={previewDoc.approvedBy}
                    />
                  )}
                  {previewDoc.approvedDate && (
                    <DetailField
                      label="Approved Date"
                      value={formatDateTime(previewDoc.approvedDate)}
                    />
                  )}
                </div>

                {previewDoc.rejectedReason && (
                  <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-sm text-red-800 dark:text-red-300">
                    <p className="text-xs font-medium mb-0.5">Rejected Reason</p>
                    {previewDoc.rejectedReason}
                  </div>
                )}

                {/* Action buttons for pending docs */}
                {previewDoc.statusName?.toLowerCase() === "pending" && (
                  <div className="flex items-center gap-2">
                    <Button
                      className="flex-1"
                      color="destructive"
                      variant="outline"
                      onClick={() => openRejectDialog(previewDoc)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      className="flex-1 hr-btn-add"
                      onClick={() => handleApprove(previewDoc)}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Reject Remark Dialog ─── */}
      <Dialog
        open={!!rejectTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null);
            setRejectRemark("");
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Reject Document
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Remark <span className="text-destructive">*</span>
              </label>
              <Textarea
                placeholder="Please provide a reason for rejection..."
                value={rejectRemark}
                onChange={(e) => setRejectRemark(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRejectTarget(null);
                  setRejectRemark("");
                }}
              >
                Cancel
              </Button>
              <Button
                color="destructive"
                size="sm"
                disabled={!rejectRemark.trim()}
                onClick={confirmReject}
              >
                <XCircle className="h-4 w-4 mr-1.5" />
                Confirm Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Sub-component ───
function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

export default DocumentVerificationPage;
