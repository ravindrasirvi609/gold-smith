"use client";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <form action="/api/auth/logout" method="post">
      <Button type="submit" variant="outline">
        Sign out
      </Button>
    </form>
  );
}

