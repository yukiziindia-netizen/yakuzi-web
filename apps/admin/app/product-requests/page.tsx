"use client";

import React, { useState } from "react";
import { 
  useProductRequests, 
  useUpdateProductRequestStatus 
} from "@/hooks/useAdmin";
import { 
  Button, 
  Badge,
  Input,
  Skeleton,
  EmptyState,
  Select
} from "@/components/ui";
import { format, subDays } from "date-fns";
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock,
  ExternalLink,
  Package
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { AdminLayout } from "@/components/layout/admin-layout";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";

// Local Table components since they are missing from @/components/ui
const Table = ({ children, className }: any) => <table className={cn("w-full text-sm", className)}>{children}</table>;
const TableHeader = ({ children, className }: any) => <thead className={cn("bg-muted/20 border-b border-border/50", className)}>{children}</thead>;
const TableBody = ({ children, className }: any) => <tbody className={cn("divide-y divide-border/30", className)}>{children}</tbody>;
const TableRow = ({ children, className, onClick }: any) => <tr className={cn("hover:bg-accent/30 transition-colors", className)} onClick={onClick}>{children}</tr>;
const TableHead = ({ children, className }: any) => <th className={cn("px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider", className)}>{children}</th>;
const TableCell = ({ children, className }: any) => <td className={cn("px-5 py-4 text-foreground", className)}>{children}</td>;

export default function ProductRequestsPage() {

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const limit = 20;

  const { data, isLoading } = useProductRequests({ 
    page, 
    limit, 
    status: status === "ALL" ? undefined : status,
    search: search || undefined,
    dateFrom: dateRange?.from?.toISOString(),
    dateTo: dateRange?.to?.toISOString(),
  });


  
  const updateStatusMutation = useUpdateProductRequestStatus();

  const requests = data?.requests || [];
  const meta = data?.meta || { total: 0, totalPages: 1 };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status: newStatus });
      toast.success(`Request status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge variant="success"><CheckCircle2 className="w-3 h-3 mr-1" /> Approved</Badge>;
      case "REJECTED":
        return <Badge variant="error"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Product Requests</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Review and manage product requests from sellers
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <DateRangePicker value={dateRange} onChange={setDateRange} align="end" />

          </div>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden border border-border/50">
          <div className="p-6 border-b border-border/50 space-y-4">
            <div className="flex items-center gap-4">
               <div className="flex-1 max-w-sm relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />

               </div>
               <Select 
                 value={status} 
                 onChange={(e) => setStatus(e.target.value)}
                 className="w-[180px]"
               >
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
               </Select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : requests.length === 0 ? (
              <EmptyState 
                icon={Package} 
                title="No requests found" 
                description="There are no product requests matching your criteria." 
              />
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Manufacturer</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request: any) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">
                          {request.productName}
                        </TableCell>
                        <TableCell>{request.manufacturer || "N/A"}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{request.user?.sellerProfile?.companyName || request.user?.buyerProfile?.legalName || "Unknown"}</span>
                            <span className="text-xs text-muted-foreground">{request.user?.phone}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(request.createdAt), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(request.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {request.status === "PENDING" && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="xs"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                                  onClick={() => handleStatusUpdate(request.id, "APPROVED")}
                                  disabled={updateStatusMutation.isPending}
                                >
                                  Approve
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="xs"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  onClick={() => handleStatusUpdate(request.id, "REJECTED")}
                                  disabled={updateStatusMutation.isPending}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button variant="ghost" size="icon">
                              <ExternalLink className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="flex items-center justify-between p-6 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    Showing {requests.length} of {meta.total} requests
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <div className="text-xs font-medium px-4">
                      Page {page} of {meta.totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                      disabled={page === meta.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
