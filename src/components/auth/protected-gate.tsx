import type { ReactNode } from "react";
import type { UserType } from "@/lib/auth-constants";
import { AuthGate } from "./auth-gate";
import { RoleGate } from "./role-gate";
import { AgencyGate } from "./agency-gate";

type ProtectedGateProps = {
  children: ReactNode;
  roles?: UserType[];
  agency?: boolean;
};

export function ProtectedGate({ children, roles, agency }: ProtectedGateProps) {
  let content = children;

  if (agency) {
    content = <AgencyGate>{content}</AgencyGate>;
  }

  if (roles) {
    content = <RoleGate roles={roles}>{content}</RoleGate>;
  }

  return <AuthGate>{content}</AuthGate>;
}
