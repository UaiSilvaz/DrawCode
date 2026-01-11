export default (editor) => {
  const bm = editor.BlockManager;

  bm.add("login-layout", {
    label: "Tela Login",
    category: "Layouts",
    content: `
      <div style="max-width:400px;margin:auto;padding:20px;background:#fff;border-radius:12px">
        <h2>Login</h2>
        <input placeholder="Email"/><br/><br/>
        <input placeholder="Senha"/><br/><br/>
        <button>Entrar</button>
      </div>
    `
  });
};
