function ProjectsPage() {
  return (
    <main className="content-page">
      <section className="panel content-card">
        <p className="eyebrow">Workspace</p>
        <h1>Projects</h1>
        <p>Organize related tasks into focused projects and keep work moving.</p>
        <div className="project-grid">
          <article>
            <h2>Product launch</h2>
            <span>12 tasks in progress</span>
          </article>
          <article>
            <h2>Website refresh</h2>
            <span>8 tasks in progress</span>
          </article>
        </div>
      </section>
    </main>
  )
}

export default ProjectsPage
