import Image from "next/image";
import UserListing from "./userlisting";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <MantineProvider>
        <UserListing />
        {/* Your app here */}
      </MantineProvider>
    </div>
  );
}
