import React from "react"

export function Show({ when, children }) {
  if (when === "signed-in") {
    return React.createElement(React.Fragment, null, children)
  }
  return null
}

export function UserButton({ children }) {
  return React.createElement(
    "div",
    { className: "mock-user-button", style: { width: 32, height: 32, borderRadius: "50%", background: "#ccc", display: "inline-block" } },
    children
  )
}
UserButton.MenuItems = function UserButtonMenuItems({ children }) {
  return React.createElement(React.Fragment, null, children)
}
UserButton.Link = function UserButtonLink({ label, labelIcon }) {
  return React.createElement(
    "button",
    { type: "button", style: { display: "flex", alignItems: "center", gap: 4 } },
    labelIcon,
    " ",
    label
  )
}

export function SignUpButton({ children }) {
  return React.createElement(React.Fragment, null, children)
}

export function SignInButton({ children }) {
  return React.createElement(React.Fragment, null, children)
}

export function useUser() {
  return { isLoaded: true, isSignedIn: true, user: { id: "mock_user_123" } }
}

export function ClerkProvider({ children }) {
  return React.createElement(React.Fragment, null, children)
}

export default { Show, UserButton, SignUpButton, SignInButton, useUser, ClerkProvider }
