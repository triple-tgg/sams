export const routerPushNewTab = (url: string) => {
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer")
  }
}