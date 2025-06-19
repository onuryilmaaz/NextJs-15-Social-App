import { z } from "zod";

const requiredString = z.string().trim().min(1, "Required");

export const signUpSchema = z.object({
  email: requiredString.email("Invalid email address"),
  username: requiredString.regex(
    /^[a-zA-Z0-9_-]+$/,
    "Only letters, numbers, - and _ allowed",
  ),
  password: requiredString.min(8, "Must be at least 8 characters"),
});

export type SignUpValues = z.infer<typeof signUpSchema>;

export const loginSchema = z.object({
  username: requiredString,
  password: requiredString,
});

export type LoginValues = z.infer<typeof loginSchema>;

export const createPostSchema = z.object({
  content: z.string().min(1, "Post cannot be empty").max(300),
  mediaIds: z.array(z.string()).optional(),
});

export type CreatePostValues = z.infer<typeof createPostSchema>;

export const updatePostSchema = z.object({
  content: z.string().min(1, "Post cannot be empty").max(300),
});

export type UpdatePostValues = z.infer<typeof updatePostSchema>;

export const updateUserProfileSchema = z.object({
  displayName: requiredString,
  bio: z.string().max(1000, "Must be at most 1000 characters"),
});

export type UpdateUserProfileValues = z.infer<typeof updateUserProfileSchema>;

export const createCommentSchema = z.object({
  text: z.string().min(1, "Comment cannot be empty").max(300),
  postId: z.string(),
});

export type CreateCommentValues = z.infer<typeof createCommentSchema>;
