"use client"

import { ResourceClient } from "@/app/dashboard/[resource]/resource-client"
import { resourceLabels, resourceFields } from "@/lib/types"
import { FabWizard } from "./fab-wizard"

export default function FabsPage() {
  return (
    <ResourceClient
      resource="fabs"
      title={resourceLabels.fabs}
      fields={resourceFields.fabs}
      customForm={props => <FabWizard {...props} />}
    />
  )
}
