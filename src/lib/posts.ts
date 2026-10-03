export type Post = {
  id: string
  slug: string
  title: string
  content: string
}

const posts: Post[] = [
  {
    id: "1",
    slug: "hello-world",
    title: "Hello, World!",
    content: "This is the first post.",
  },
]

export async function getPosts(): Promise<Post[]> {
  return posts
}

export async function getPost(slug: string): Promise<Post> {
  const post = posts.find((p) => p.slug === slug)
  if (!post) throw new Error(`Post not found: ${slug}`)
  return post
}
