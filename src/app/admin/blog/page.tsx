import { getPosts } from "@/lib/posts"
import { Post } from "@/app/admin/ui/post"

export default async function Page() {
  const posts = await getPosts()

  return (
    <ul>
      {posts.map((post) => (
        <Post key={post.id} post={post} />
      ))}
    </ul>
  )
}
