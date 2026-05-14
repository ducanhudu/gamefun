export function showMessage(message: string = ''): void {
  const messageDOM: HTMLDialogElement | null =
    document.querySelector('.message-body')
  if (!messageDOM) {
    console.error('Không tìm thấy hộp thoại thông báo')
    return
  }
  const messageContentDOM: HTMLDivElement | null = document.querySelector(
    '.message-body-content',
  )
  if (!messageContentDOM) {
    console.error('Không tìm thấy nội dung hộp thoại')
    return
  }

  if (messageDOM.hasAttribute('open')) {
    messageDOM.close()
  }
  messageContentDOM.innerHTML = message
  messageDOM.showModal()
}
