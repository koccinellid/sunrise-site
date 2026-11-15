import { DownloadPage } from "@/components/download-page";
import { pageMetadata } from "@/components/site";

export const metadata = pageMetadata({
  title: "Download Sunrise",
  description: "Download Sunrise's launcher: it installs the game, prepares it from your own copy of Minecraft and keeps it up to date.",
  path: "/download",
});

export default function Download() {
  return <DownloadPage />;
}
