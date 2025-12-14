'use client'

import { ChangeEvent } from 'react'

interface InputNameProps {
  firstName: string
  lastName: string
  onFirstNameChange: (e: ChangeEvent<HTMLInputElement>) => void
  onLastNameChange: (e: ChangeEvent<HTMLInputElement>) => void
}

function InputName({ firstName, lastName, onFirstNameChange, onLastNameChange }: InputNameProps) {
  return (
    <div className="border border-slate-300 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-slate-200">
        <input
          id="firstName"
          type="text"
          value={firstName}
          onChange={onFirstNameChange}
          placeholder="First name on ID"
          className="w-full border-0 outline-none text-slate-900 text-base bg-transparent focus:ring-0 placeholder-slate-500"
          required
        />
      </div>
      <div className="p-4">
        <input
          id="lastName"
          type="text"
          value={lastName}
          onChange={onLastNameChange}
          placeholder="Last name on ID"
          className="w-full border-0 outline-none text-slate-900 text-base bg-transparent focus:ring-0 placeholder-slate-500"
          required
        />
      </div>
    </div>
  )
}

export default InputName
