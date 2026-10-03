import Link from "next/link"
import type { Post as PostType } from "@/lib/posts"

export function Post({ post }: { post: PostType }) {
  return (
    <li>
      <Link href={`/blog/${post.slug}`}>{post.title}</Link>
    </li>
  )
}
