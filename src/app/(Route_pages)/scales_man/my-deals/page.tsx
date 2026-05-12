import { MyDealsClient } from "./my_deal_client";

export const metadata = {
  title: "My Deals - CRM",
  description: "Manage and track all your active opportunities",
};

export default function MyDealsPage() {
  return <MyDealsClient />;
}
