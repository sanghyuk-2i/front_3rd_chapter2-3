import { useEffect, useMemo, useState } from "react"
import { Edit2, MessageSquare, Plus, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react"
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../shared/ui"
import { highlightText } from "../shared/lib/text"
import UserInfoDialog from "../entities/user/components/UserInfoDialog"
import Loading from "../shared/ui/Loading"
import { useUser, useUsers } from "../entities/user/api/get-user"
import { usePosts } from "../entities/post/api/get-post"
import { useAddPost } from "../features/post/api/create-post"
import { useDeletePost } from "../features/post/api/delete-post"
import { Post } from "../entities/post/model/types"
import { useUpdatePost } from "../features/post/api/update-post"
import { useSearchPosts } from "../features/search/api/update-search"
import Pagination from "../shared/ui/Pagination"
import PostModifyDialog from "../features/post/components/PostModifyDialog"
import PostAddDialog from "../features/post/components/PostAddDialog"
import Finder from "../features/search/components/Finder"
import PostDetailDialog from "../features/post/components/PostDetailDialog"
import useSearchParams from "../features/search/libs/useSearchParams"
import PostTableAction from "../features/post/components/PostTableAction"
import PostTable from "../features/post/components/PostTable"

const PostsManager = () => {
  // 상태 관리
  const [total, setTotal] = useState(0)
  const [newPost, setNewPost] = useState({ title: "", body: "", userId: 1 })
  const [loading, setLoading] = useState(false)

  const [selectedPost, setSelectedPost] = useState(null)

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showPostDetailDialog, setShowPostDetailDialog] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)

  //  여기서 부터

  const {
    searchParams: { sortBy, sortOrder, tag, skip, limit, search },
    setSearchParams,
    changeSeachParams,
  } = useSearchParams()

  const [userId, setUserId] = useState<number>(0)
  const [postId, setPostId] = useState<number>(0)

  // Post
  const {
    data: { posts },
    isPending,
  } = usePosts({ limit: Number(limit), skip: Number(skip) })
  const { mutate: addPost } = useAddPost()
  const { mutate: updatePost } = useUpdatePost()
  const { mutate: deletePost } = useDeletePost()

  // Search
  const { data: searchedPosts, mutate: searchPost } = useSearchPosts()

  // User
  const {
    data: { users },
  } = useUsers()
  const { data: user } = useUser({ userId })

  const targetPost = useMemo(() => (search ? (searchedPosts?.posts ?? []) : posts), [search, searchedPosts, posts])

  // -------

  // 게시물 가져오기
  const fetchPosts = () => {
    setLoading(true)
    let postsData
    let usersData

    fetch(`/api/posts?limit=${limit}&skip=${skip}`)
      .then((response) => response.json())
      .then((data) => {
        postsData = data
        return fetch("/api/users?limit=0&select=username,image")
      })
      .then((response) => response.json())
      .then((users) => {
        usersData = users.users
        const postsWithUsers = postsData.posts.map((post) => ({
          ...post,
          author: usersData.find((user) => user.id === post.userId),
        }))
        setPosts(postsWithUsers)
        setTotal(postsData.total)
      })
      .catch((error) => {
        console.error("게시물 가져오기 오류:", error)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  // 게시물 검색
  // @TODO: loading
  const handleSearch = () => {
    searchPost(search, {
      onSuccess: (data) => {
        console.log(data)
        setTotal(data.total)
      },
      onError: (error) => {
        console.error("게시물 검색 오류:", error)
      },
    })
  }

  // 태그별 게시물 가져오기
  const fetchPostsByTag = async (tag) => {
    if (!tag || tag === "all") {
      fetchPosts()
      return
    }
    setLoading(true)
    try {
      const [postsResponse, usersResponse] = await Promise.all([
        fetch(`/api/posts/tag/${tag}`),
        fetch("/api/users?limit=0&select=username,image"),
      ])
      const postsData = await postsResponse.json()
      const usersData = await usersResponse.json()

      const postsWithUsers = postsData.posts.map((post) => ({
        ...post,
        author: usersData.users.find((user) => user.id === post.userId),
      }))

      setPosts(postsWithUsers)
      setTotal(postsData.total)
    } catch (error) {
      console.error("태그별 게시물 가져오기 오류:", error)
    }
    setLoading(false)
  }

  // 게시물 추가
  const handleAddPost = (newPost: Pick<Post, "title" | "body" | "userId">) => {
    addPost(newPost, {
      onSuccess: () => {
        setShowAddDialog(false)
        setNewPost({ title: "", body: "", userId: 1 })
      },
      onError: (error) => {
        console.error("게시물 추가 오류:", error)
      },
    })
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

  // 게시물 상세 보기
  const openPostDetail = (post) => {
    setSelectedPost(post)
    setPostId(post.id)
    setShowPostDetailDialog(true)
  }

  // 사용자 모달 열기
  const openUserModal = async (userId) => {
    setUserId(userId)
    setShowUserModal(true)
  }

  useEffect(() => {
    if (tag) {
      fetchPostsByTag(tag)
    } else {
      fetchPosts()
    }
  }, [skip, limit, sortBy, sortOrder, tag])

  // 게시물 테이블 렌더링
  const renderPostTable = () => (
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
              <div className="flex items-center space-x-2 cursor-pointer" onClick={() => openUserModal(post.userId)}>
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
  )

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>게시물 관리자</span>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            게시물 추가
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-4">
          {/* 검색 및 필터 컨트롤 */}
          <Finder
            searchQuery={search}
            selectedTag={tag}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSearchChange={changeSeachParams("search")}
            onSearchSubmit={handleSearch}
            onSelectedTagChange={(value) => {
              setSearchParams((prev) => ({ ...prev, tag: value }))
              fetchPostsByTag(value)
            }}
            onSortByChange={changeSeachParams("sortBy")}
            onSortOrderChange={changeSeachParams("sortOrder")}
          />

          {/* 게시물 테이블 */}
          {loading || isPending ? <Loading /> : renderPostTable()}

          {/* 페이지네이션 */}
          <Pagination
            limit={Number(limit)}
            skip={Number(skip)}
            total={total}
            onChange={changeSeachParams("limit")}
            onBackButton={changeSeachParams("skip")}
            onNextButton={changeSeachParams("skip")}
          />
        </div>
      </CardContent>

      {/* 게시물 추가 대화상자 */}
      <PostAddDialog open={showAddDialog} onOpenChange={setShowAddDialog} onSubmit={handleAddPost} />

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

      {/* 사용자 모달 */}
      <UserInfoDialog open={showUserModal} onOpenChange={setShowUserModal} user={user} />
    </Card>
  )
}

export default PostsManager
