import { EmptyState } from "@/components/EmptyState";

export default function NotFound() {
  return (
    <main className="room grid min-h-dvh place-items-center">
      <EmptyState
        expression="concerned"
        title="This pocket is empty."
        body="The page you were looking for isn't in the binder. It may have moved, or the link may be wrong."
        actions={[
          { href: "/cards", label: "Go to Discover", variant: "primary" },
          { href: "/", label: "Home", variant: "secondary" },
        ]}
      />
    </main>
  );
}
