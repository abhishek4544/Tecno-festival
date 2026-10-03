import { getPost } from "@/lib/posts"

export default async function BlogPostPage(props: PageProps<"/admin/blog/[slug]">) {
  const { slug } = await props.params
  const post = await getPost(slug)

  return (
    <div>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </div>
  )
}
