import { Link } from 'react-router-dom';

function AdminPage() {
  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <h1>管理后台</h1>

          <p>
            管理函数、写法版本、分类和标签。
          </p>
        </div>

        <Link to="/">
          返回知识库
        </Link>
      </header>

      <section className="admin-menu">
        <Link
          to="/admin/functions"
          className="admin-card"
        >
          <h2>函数管理</h2>

          <p>
            新增、编辑和删除函数知识。
          </p>
        </Link>

        <Link
          to="/admin/categories"
          className="admin-card"
        >
          <h2>分类管理</h2>

          <p>
            管理语言、框架和技术分类树。
          </p>
        </Link>

        <Link
          to="/admin/tags"
          className="admin-card"
        >
          <h2>标签管理</h2>

          <p>
            管理函数的横向知识标签。
          </p>
        </Link>
      </section>
    </main>
  );
}

export default AdminPage;