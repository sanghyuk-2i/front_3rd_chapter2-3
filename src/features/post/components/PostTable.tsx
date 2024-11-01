import { Table, ThumbsDown, ThumbsUp } from "lucide-react"
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../shared/ui"
import { highlightText } from "../../../shared/lib/text"
import PostTableAction from "./PostTableAction"
import useSearchParams from "../../search/libs/useSearchParams"
import { usePosts } from "../../../entities/post/api/get-post"
import { useMemo, useState } from "react"
import { Post } from "../../../entities/post/model/types"
import PostDetailDialog from "./PostDetailDialog"
import PostModifyDialog from "./PostModifyDialog"
import { useDeletePost } from "../api/delete-post"
import { useUpdatePost } from "../api/update-post"

export interface PostTableProps {
  searchedPosts: { posts: Post[] } | undefined
  onOpenUserModal: (userId: Post["userId"]) => void
}

const PostTable = ({ searchedPosts, onOpenUserModal }: PostTableProps) => {
  const {
    searchParams: { search, limit, skip, tag },
    setSearchParams,
  } = useSearchParams()

  const {
    data: { posts },
  } = usePosts({ limit: Number(limit), skip: Number(skip) })
  const { mutate: updatePost } = useUpdatePost()
  const { mutate: deletePost } = useDeletePost()

  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [postId, setPostId] = useState<number>(0)

  const [showPostDetailDialog, setShowPostDetailDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)

  const openPostDetail = (post: Post) => {
    setSelectedPost(post)
    setPostId(post.id)
    setShowPostDetailDialog(true)
  }

  const handleOpenUserModal = (userId: Post["userId"]) => {
    onOpenUserModal(userId)
  }

  // 게시물 업데이트
  const handleUpdatePost = (post: Post) => {
    updatePost(
      { id: post.id, post },
      {
        onSuccess: () => {
          setShowEditDialog(false)
        },
        onError: (error) => {
          console.error("게시물 업데이트 오류:", error)
        },
      },
    )
  }

  // 게시물 삭제
  const handleDeletePost = async (id: Post["id"]) => {
    deletePost(
      { id },
      {
        onError: (error) => {
          console.error("게시물 삭제 오류:", error)
        },
      },
    )
  }

  const targetPost = useMemo(() => (search ? (searchedPosts?.posts ?? []) : posts), [search, searchedPosts, posts])

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">ID</TableHead>
            <TableHead>제목</TableHead>
            <TableHead className="w-[150px]">작성자</TableHead>
            <TableHead className="w-[150px]">반응</TableHead>
            <TableHead className="w-[150px]">작업</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {targetPost.map((post) => (
            <TableRow key={post.id}>
              <TableCell>{post.id}</TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div>{highlightText(post.title, search)}</div>

                  <div className="flex flex-wrap gap-1">
                    {post.tags.map((postTag) => (
                      <span
                        key={`tag_${postTag}`}
                        className={`px-1 text-[9px] font-semibold rounded-[4px] cursor-pointer ${
                          tag === postTag.name
                            ? "text-white bg-blue-500 hover:bg-blue-600"
                            : "text-blue-800 bg-blue-100 hover:bg-blue-200"
                        }`}
                        onClick={() => {
                          setSearchParams((prev) => ({ ...prev, tag: postTag.name }))
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <div
                  className="flex items-center space-x-2 cursor-pointer"
                  onClick={() => handleOpenUserModal(post.userId)}
                >
                  <img src={post.author?.image} alt={post.author?.username} className="w-8 h-8 rounded-full" />
                  <span>{post.author?.username}</span>
                </div>
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4" />
                  <span>{post.reactions?.likes || 0}</span>
                  <ThumbsDown className="w-4 h-4" />
                  <span>{post.reactions?.dislikes || 0}</span>
                </div>
              </TableCell>

              <TableCell>
                <PostTableAction
                  onCommentButton={() => openPostDetail(post)}
                  onEditButton={() => {
                    setSelectedPost(post)
                    setShowEditDialog(true)
                  }}
                  onDeleteButton={() => handleDeletePost(post.id)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* 게시물 수정 대화상자 */}
      <PostModifyDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        post={selectedPost}
        onSubmit={handleUpdatePost}
      />

      {/* 게시물 상세 보기 대화상자 */}
      <PostDetailDialog
        open={showPostDetailDialog}
        post={selectedPost}
        postId={postId}
        searchQuery={search}
        onOpenChange={setShowPostDetailDialog}
      />
    </>
  )
}

export default PostTable
