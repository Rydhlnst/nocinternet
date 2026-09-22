import { requireUser } from "@/lib/auth"
import { resourceFields, resourceLabels, type Resource } from "@/lib/types"
import { ResourceClient } from "./resource-client"
export default async function ResourcePage({ params }: { params: Promise<{ resource: string }> }) { const { resource } = await params; const valid = ["sites", "cids", "fabs", "upgrades", "maintenance"].includes(resource); if (!valid) return null; await requireUser(); return <div className="content"><ResourceClient resource={resource as Resource} title={resourceLabels[resource as Resource]} fields={resourceFields[resource as Resource]} /></div> }
