export type AsyncState<T> =
  | { status: "idle"; data?: T; error?: undefined }
  | { status: "loading"; data?: T; error?: undefined }
  | { status: "success"; data: T; error?: undefined }
  | { status: "error"; data?: T; error: Error };
