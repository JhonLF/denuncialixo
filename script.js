document
	.getElementById("denunciaForm")
	.addEventListener("submit", function (event) {
		event.preventDefault();

		const descricao = document.getElementById("descricao").value;
		const local = document.getElementById("local").value;
		const imagem = document.getElementById("imagem").files[0];

		if (descricao && local) {
			const formData = new FormData();
			formData.append("descricao", descricao);
			formData.append("local", local);
			if (imagem) formData.append("imagem", imagem);

			// Enviar os dados para a API
			fetch("http://denuncialixo.whf.bz:5500/api/denuncia", {
				method: "POST",
				body: formData,
				headers: {
					'Accept': '*/*',
				}
			})
				.then((response) => {
					console.log(response);
					return response.json();
				})
				.then((data) => {
					alert("Denúncia registrada com sucesso!");
				})
				.catch((error) => {
					console.error("Erro:", error);
					alert("Erro ao enviar a denúncia: " + error.message);
				});
		} else {
			alert("Por favor, preencha todos os campos obrigatórios.");
		}
	});
});
