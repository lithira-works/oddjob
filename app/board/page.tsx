import type { Metadata } from "next";
import { Board } from "@/components/Board";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "For pros",
  description: "See jobs near you and pay only to answer the ones you want.",
};

export default function BoardPage() {
  return (
    <div className="board on-accent">
      <Nav action={false} />
      <main className="board__body">
        <Board />
      </main>
    </div>
  );
}
