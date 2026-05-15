function getMessageDialog() {
  return document.querySelector('.message-body') as HTMLDialogElement | null
}

export function showMessage(message: string = ''): void {
  const messageDOM = getMessageDialog()
  if (!messageDOM) {
    console.error('Không tìm thấy hộp thoại thông báo')
    return
  }

  const messageContentDOM = document.querySelector(
    '.message-body-content',
  ) as HTMLDivElement | null
  if (!messageContentDOM) {
    console.error('Không tìm thấy nội dung hộp thoại')
    return
  }

  if (messageDOM.open) {
    messageDOM.close()
  }
  messageContentDOM.innerHTML = message
  messageDOM.showModal()
}

export function closeMessage() {
  const messageDOM = getMessageDialog()
  if (messageDOM?.open) {
    messageDOM.close()
  }
}
