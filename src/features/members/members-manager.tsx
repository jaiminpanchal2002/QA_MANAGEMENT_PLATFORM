"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Loader2, UserPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  addMemberAction,
  removeMemberAction,
  updateMemberRoleAction,
} from "./actions";
import { ORG_ROLES, type OrgRole } from "@/lib/authorization/permissions";
import { canAssignOrgRole } from "@/lib/authorization/rbac";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Member {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string | Date;
}

export function MembersManager({
  members,
  currentUserId,
  actorRole,
  canManage,
}: {
  members: Member[];
  currentUserId: string;
  actorRole: OrgRole;
  canManage: boolean;
}) {
  const assignableRoles = React.useMemo(
    () => ORG_ROLES.filter((r) => canAssignOrgRole(actorRole, r)),
    [actorRole]
  );

  return (
    <div className="space-y-6">
      {canManage && assignableRoles.length > 0 && (
        <AddMemberForm assignableRoles={assignableRoles} />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Members ({members.length})
          </CardTitle>
          <CardDescription>
            {canManage
              ? "Assign roles or remove members. You can only manage roles at or below your own."
              : "You have read access to the member list."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  {canManage && (
                    <TableHead className="text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => {
                  const isSelf = m.userId === currentUserId;
                  const manageable =
                    canManage &&
                    !isSelf &&
                    canAssignOrgRole(actorRole, m.role as OrgRole);
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">
                        {m.name}
                        {isSelf && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (you)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {m.email}
                      </TableCell>
                      <TableCell>
                        {manageable ? (
                          <RoleSelect
                            membershipId={m.id}
                            current={m.role as OrgRole}
                            assignableRoles={assignableRoles}
                          />
                        ) : (
                          <Badge
                            variant={
                              m.role === "OWNER" ? "default" : "secondary"
                            }
                          >
                            {m.role}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(m.joinedAt), "MMM d, yyyy")}
                      </TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          {manageable ? (
                            <RemoveMemberButton
                              membershipId={m.id}
                              name={m.name}
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AddMemberForm({ assignableRoles }: { assignableRoles: OrgRole[] }) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<OrgRole>(
    assignableRoles.includes("MEMBER") ? "MEMBER" : assignableRoles[0]!
  );
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await addMemberAction({ email, role });
    setLoading(false);
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    toast.success("Member added");
    setEmail("");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add a member</CardTitle>
        <CardDescription>
          Add an existing account to this organization by email and assign a
          role.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1 space-y-2">
            <Label htmlFor="member-email">Email</Label>
            <Input
              id="member-email"
              type="email"
              placeholder="teammate@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="member-role">Role</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as OrgRole)}
            >
              <SelectTrigger id="member-role" className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {assignableRoles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={loading || !email}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Add member
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function RoleSelect({
  membershipId,
  current,
  assignableRoles,
}: {
  membershipId: string;
  current: OrgRole;
  assignableRoles: OrgRole[];
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  // The current role may sit outside the actor's assignable set (e.g. OWNER);
  // include it so the trigger renders the real value.
  const options = Array.from(new Set<OrgRole>([current, ...assignableRoles]));

  function onChange(next: string) {
    if (next === current) return;
    startTransition(async () => {
      const result = await updateMemberRoleAction({
        membershipId,
        role: next as OrgRole,
      });
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Role updated");
      router.refresh();
    });
  }

  return (
    <Select value={current} onValueChange={onChange} disabled={pending}>
      <SelectTrigger className="h-8 w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((r) => (
          <SelectItem key={r} value={r}>
            {r}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function RemoveMemberButton({
  membershipId,
  name,
}: {
  membershipId: string;
  name: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  function onConfirm() {
    startTransition(async () => {
      const result = await removeMemberAction({ membershipId });
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Member removed");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive"
        onClick={() => setOpen(true)}
        aria-label={`Remove ${name}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove member</DialogTitle>
          <DialogDescription>
            Remove <span className="font-medium">{name}</span> from this
            organization? They lose access immediately. This does not delete
            their account.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={pending}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
