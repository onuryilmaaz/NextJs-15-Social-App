import PostEditor from "@/components/posts/editor/PostEditor";
import Image from "next/image";

export default function Home() {
  return (
    <main className="h-[200vh] w-full bg-red-50">
      <div className="w-full">
            <PostEditor/>
      </div>
    </main>
  )
}