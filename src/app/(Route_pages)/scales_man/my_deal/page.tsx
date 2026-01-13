import { Suspense } from "react";
import { MyDealsClient } from "./my_deal_client";

export const metadata = {
  title: "My Deals - CRM",
  description: "Manage and track all your active opportunities",
};

export default function MyDealsPage() {
  return (
    <Suspense fallback={null}>
      <MyDealsClient />
    </Suspense>
  );
}
