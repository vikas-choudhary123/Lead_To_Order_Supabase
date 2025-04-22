function Footer() {
  return (
    <footer className="py-6 border-t bg-white">
      <div className="container mx-auto flex justify-center items-center px-4">
        <p className="text-sm text-slate-500">
          Powered By -{" "}
          <a
            href="https://botivate.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:underline text-purple-600"
          >
            Botivate
          </a>
        </p>
      </div>
    </footer>
  )
}

export default Footer
