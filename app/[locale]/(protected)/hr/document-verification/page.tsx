"use client";

import React, { useState, useMemo } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import "../staff/hr-staff.css";

// ─── Types ───
type DocStatus = "pending" | "approved" | "rejected";

interface StaffDocument {
  id: string;
  staffId: number;
  employeeId: string;
  staffName: string;
  staffTitle: string;
  department: string;
  position: string;
  profileImage?: string;
  documentType: string;
  documentLabel: string;
  fileName: string;
  filePath: string;
  uploadedDate: string;
  status: DocStatus;
  reviewedBy?: string;
  reviewedDate?: string;
  remark?: string;
}

// ─── Mock Data ───
const MOCK_DOCUMENTS: StaffDocument[] = [
  {
    id: "DOC001",
    staffId: 1,
    employeeId: "EMP-0101",
    staffName: "Somchai Prasert",
    staffTitle: "Mr.",
    department: "Maintenance",
    position: "Chief Station Engineer",
    documentType: "id_card",
    documentLabel: "ID Card",
    fileName: "somchai_idcard.pdf",
    filePath: "/uploads/somchai_idcard.pdf",
    uploadedDate: "2026-07-10T09:30:00Z",
    status: "pending",
  },
  {
    id: "DOC002",
    staffId: 1,
    employeeId: "EMP-0101",
    staffName: "Somchai Prasert",
    staffTitle: "Mr.",
    department: "Maintenance",
    position: "Chief Station Engineer",
    documentType: "passport",
    documentLabel: "Passport",
    fileName: "somchai_passport.pdf",
    filePath: "/uploads/somchai_passport.pdf",
    uploadedDate: "2026-07-10T09:35:00Z",
    status: "approved",
    reviewedBy: "admin",
    reviewedDate: "2026-07-11T10:00:00Z",
  },
  {
    id: "DOC003",
    staffId: 2,
    employeeId: "EMP-0102",
    staffName: "Apinya Suksawat",
    staffTitle: "Ms.",
    department: "Compliance Monitoring",
    position: "Quality Auditor",
    documentType: "cv",
    documentLabel: "CV",
    fileName: "apinya_cv.pdf",
    filePath: "/uploads/apinya_cv.pdf",
    uploadedDate: "2026-07-09T14:00:00Z",
    status: "pending",
  },
  {
    id: "DOC004",
    staffId: 3,
    employeeId: "EMP-0103",
    staffName: "Wichai Khumkha",
    staffTitle: "Mr.",
    department: "Safety Management",
    position: "Aircraft Certifying Staff",
    documentType: "amel",
    documentLabel: "AMEL",
    fileName: "wichai_amel.pdf",
    filePath: "/uploads/wichai_amel.pdf",
    uploadedDate: "2026-07-08T11:20:00Z",
    status: "rejected",
    reviewedBy: "admin",
    reviewedDate: "2026-07-09T08:00:00Z",
    remark: "Document is expired, please upload a valid one.",
  },
  {
    id: "DOC005",
    staffId: 4,
    employeeId: "EMP-0104",
    staffName: "Nattaya Lertchai",
    staffTitle: "Ms.",
    department: "Maintenance",
    position: "Duty Engineer",
    documentType: "training_records",
    documentLabel: "Previous Training Records",
    fileName: "nattaya_training.pdf",
    filePath: "/uploads/nattaya_training.pdf",
    uploadedDate: "2026-07-12T16:45:00Z",
    status: "pending",
  },
  {
    id: "DOC006",
    staffId: 5,
    employeeId: "EMP-0163",
    staffName: "Aleks Reymer",
    staffTitle: "Mr.",
    department: "Maintenance",
    position: "Commercial Manager",
    documentType: "aircraft_type_cert",
    documentLabel: "Aircraft Type Certificate",
    fileName: "aleks_typecert.pdf",
    filePath: "/uploads/aleks_typecert.pdf",
    uploadedDate: "2026-07-13T08:00:00Z",
    status: "pending",
  },
];

const DOCUMENT_TYPES = [
  { key: "id_card", label: "ID Card" },
  { key: "passport", label: "Passport" },
  { key: "cv", label: "CV" },
  { key: "amel", label: "AMEL" },
  { key: "experience_log", label: "Previous Experience Log" },
  { key: "training_records", label: "Previous Training Records" },
  { key: "aircraft_type_cert", label: "Aircraft Type Certificate" },
];

// ─── Avatar helpers (same as Staff List) ───
const avatarGradients = [
  "linear-gradient(135deg,#7c3aed,#a855f7)",
  "linear-gradient(135deg,#dc2626,#ef4444)",
  "linear-gradient(135deg,#0369a1,#3b82f6)",
  "linear-gradient(135deg,#b45309,#f59e0b)",
  "linear-gradient(135deg,#065f46,#22c55e)",
  "linear-gradient(135deg,#1e40af,#60a5fa)",
  "linear-gradient(135deg,#9333ea,#c084fc)",
  "linear-gradient(135deg,#475569,#94a3b8)",
  "linear-gradient(135deg,#0f766e,#2dd4bf)",
  "linear-gradient(135deg,#be185d,#f472b6)",
  "linear-gradient(135deg,#ea580c,#fb923c)",
  "linear-gradient(135deg,#4338ca,#818cf8)",
];

function getInitials(name: string): string {
  if (!name) return "?";
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function getAvatarBg(id: number): string {
  return avatarGradients[id % avatarGradients.length];
}

// ─── Status config ───
const statusColors = {
  pending: "primary",
  approved: "success",
  rejected: "destructive",
} as const;

const statusLabels: Record<DocStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

const statusIcons: Record<DocStatus, React.ReactNode> = {
  pending: <Clock className="h-3 w-3" />,
  approved: <CheckCircle2 className="h-3 w-3" />,
  rejected: <XCircle className="h-3 w-3" />,
};

const DocumentVerificationPage = () => {
  const [documents, setDocuments] = useState<StaffDocument[]>([
    ...MOCK_DOCUMENTS,
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDocType, setFilterDocType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [previewDoc, setPreviewDoc] = useState<StaffDocument | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectRemark, setRejectRemark] = useState("");

  // Filtered
  const filtered = useMemo(() => {
    let list = documents;
    if (filterDocType !== "all") {
      list = list.filter((d) => d.documentType === filterDocType);
    }
    if (filterStatus !== "all") {
      list = list.filter((d) => d.status === filterStatus);
    }
    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      list = list.filter(
        (d) =>
          d.employeeId.toLowerCase().includes(lower) ||
          d.staffName.toLowerCase().includes(lower) ||
          d.documentLabel.toLowerCase().includes(lower)
      );
    }
    return list;
  }, [documents, filterDocType, filterStatus, searchQuery]);

  // Stats
  const pendingCount = documents.filter((d) => d.status === "pending").length;

  // Handlers
  const handleApprove = (docId: string) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId
          ? {
              ...d,
              status: "approved" as DocStatus,
              reviewedBy: "system",
              reviewedDate: new Date().toISOString(),
            }
          : d
      )
    );
    toast.success("Document approved");
    setPreviewDoc(null);
  };

  const openRejectDialog = (docId: string) => {
    setRejectTarget(docId);
    setRejectRemark("");
  };

  const confirmReject = () => {
    if (!rejectTarget || !rejectRemark.trim()) return;
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === rejectTarget
          ? {
              ...d,
              status: "rejected" as DocStatus,
              reviewedBy: "system",
              reviewedDate: new Date().toISOString(),
              remark: rejectRemark.trim(),
            }
          : d
      )
    );
    toast.success("Document rejected");
    setRejectTarget(null);
    setRejectRemark("");
    setPreviewDoc(null);
  };

  const handleRefresh = () => {
    setDocuments([...MOCK_DOCUMENTS]);
    setSearchQuery("");
    setFilterDocType("all");
    setFilterStatus("all");
    toast.info("Data refreshed");
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

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
                {documents.length} documents
                {pendingCount > 0 && (
                  <span className="text-amber-600 dark:text-amber-400 ml-1.5">
                    · {pendingCount} pending review
                  </span>
                )}
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
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
              <Select
                value={filterDocType}
                onValueChange={setFilterDocType}
              >
                <SelectTrigger className="h-9 min-w-[180px] bg-white text-xs">
                  <SelectValue placeholder="Document Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Document Types</SelectItem>
                  {DOCUMENT_TYPES.map((dt) => (
                    <SelectItem key={dt.key} value={dt.key}>
                      {dt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filterStatus}
                onValueChange={setFilterStatus}
              >
                <SelectTrigger className="h-9 min-w-[120px] bg-white text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
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
              {filtered.length === 0 ? (
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
                filtered.map((doc, index) => (
                  <TableRow
                    key={doc.id}
                    className="cursor-pointer hover:bg-blue-50/50 transition-colors"
                    onClick={() => setPreviewDoc(doc)}
                  >


                    {/* Employee Name + Code (Staff List style) */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {doc.profileImage ? (
                          <img
                            src={doc.profileImage}
                            alt={doc.staffName}
                            className="h-[34px] w-[34px] rounded-[10px] object-cover shrink-0"
                          />
                        ) : (
                          <div className="h-[34px] w-[34px] rounded-[10px] bg-muted flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-sm">
                            {doc.staffTitle} {doc.staffName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {doc.employeeId}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Document type */}
                    <TableCell className="text-sm">
                      {doc.documentLabel}
                    </TableCell>




                    {/* Upload date */}
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(doc.uploadedDate)}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge
                        color={statusColors[doc.status]}
                        className="text-xs"
                      >
                        {statusLabels[doc.status]}
                      </Badge>
                    </TableCell>

                    {/* Action (Staff List ··· dropdown style) */}
                    <TableCell
                      className="text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Preview file"
                          onClick={() => window.open(doc.filePath, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
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
                            {doc.status === "pending" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleApprove(doc.id)}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openRejectDialog(doc.id)}
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

          {/* Footer — same style as Staff List pagination area */}
          <div className="flex items-center justify-between px-5 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {filtered.length} of {documents.length} documents
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
                  {previewDoc.profileImage ? (
                    <img
                      src={previewDoc.profileImage}
                      alt={previewDoc.staffName}
                      className="h-12 w-12 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {previewDoc.staffTitle} {previewDoc.staffName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {previewDoc.employeeId}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {previewDoc.department}
                      </span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">
                        {previewDoc.position}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Document details */}
                <div className="grid grid-cols-2 gap-4">
                  <DetailField
                    label="Document Type"
                    value={previewDoc.documentLabel}
                  />
                  <DetailField
                    label="Upload Date"
                    value={formatDateTime(previewDoc.uploadedDate)}
                  />
                  {/* File row with inline actions */}
                  <div className="col-span-2 flex items-center justify-between p-2.5 rounded-md border bg-muted/30">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">File</p>
                        <p className="text-sm font-medium truncate">{previewDoc.fileName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Preview in new tab"
                        onClick={() => window.open(previewDoc.filePath, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
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
                    value={statusLabels[previewDoc.status]}
                  />
                  {previewDoc.reviewedBy && (
                    <DetailField
                      label="Reviewed By"
                      value={previewDoc.reviewedBy}
                    />
                  )}
                  {previewDoc.reviewedDate && (
                    <DetailField
                      label="Reviewed Date"
                      value={formatDateTime(previewDoc.reviewedDate)}
                    />
                  )}
                </div>

                {previewDoc.remark && (
                  <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-sm text-red-800 dark:text-red-300">
                    <p className="text-xs font-medium mb-0.5">Remark</p>
                    {previewDoc.remark}
                  </div>
                )}

                {/* Action buttons for pending docs */}
                {previewDoc.status === "pending" && (
                  <div className="flex items-center gap-2">
                    <Button
                      className="flex-1"
                      color="destructive"
                      variant="outline"
                      onClick={() => openRejectDialog(previewDoc.id)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      className="flex-1 hr-btn-add"
                      onClick={() => handleApprove(previewDoc.id)}
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
