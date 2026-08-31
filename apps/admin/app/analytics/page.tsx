import { redirect } from "next/navigation";

/**
 * The Business view moved into the Dashboard (one home for platform numbers
 * instead of two near-identical pages). Kept as a redirect so existing links,
 * bookmarks and the sub-pages' "Business" tab all land in the right place.
 */
export default function AnalyticsPage() {
  redirect("/dashboard");
}
