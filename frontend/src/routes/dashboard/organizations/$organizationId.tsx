import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/dashboard/organizations/$organizationId',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/organizations/$organizationId"!</div>
}
