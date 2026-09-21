export default function UserAddressCard() {
  return (
    <div className="rounded-2xl border border-gray-200 p-5 lg:p-6 dark:border-gray-800">
      <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Additional details</h4>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Address, phone, tax ID, and social links are not stored on the User account yet.
      </p>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div><p className="mb-2 text-xs text-gray-500">Address</p><p className="text-sm font-medium text-gray-800 dark:text-white/90">Not set</p></div>
        <div><p className="mb-2 text-xs text-gray-500">Phone</p><p className="text-sm font-medium text-gray-800 dark:text-white/90">Not set</p></div>
        <div><p className="mb-2 text-xs text-gray-500">Bio</p><p className="text-sm font-medium text-gray-800 dark:text-white/90">Not set</p></div>
      </div>
    </div>
  );
}
