// Importando as dependências
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const bodyParser = require("body-parser");
const fs = require("fs");
const cors = require("cors"); // Middleware para CORS
const path = require("path");

// Inicializando o app do Express
const app = express();
app.options("/api/denuncia", cors()); // Permitir requisições OPTIONS para a rota
// Configuração do CORS
app.use(
    cors({
        origin: ["http://denuncialixo.whf.bz", "http://198.45.114.194"],
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "Accept"],
        credentials: true
    })
);

// Agora a variável 'app' foi inicializada

// Middleware para processar requisições JSON
app.use(bodyParser.json());

// Conexão com o MongoDB usando Mongoose
const uri = process.env.MONGO_URI || "mongodb+srv://adm:eVjUKksFWQCJd0p8@denunciabd.frdqtwa.mongodb.net/?retryWrites=true&w=majority&appName=denunciaBD";

mongoose
    .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("Conectado ao MongoDB!");
    })
    .catch((err) => {
        console.error("Erro ao conectar ao MongoDB: ", err);
    });

// Definindo o modelo da Denúncia
const denunciaSchema = new mongoose.Schema({
	descricao: String,
	local: String,
	imagem: String, // Nome do arquivo da imagem
	data: { type: Date, default: Date.now },
});

const Denuncia = mongoose.model("Denuncia", denunciaSchema);

// Criar diretório para uploads caso não exista
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir);
}

// Configuração do Multer para salvar as imagens
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, uploadDir); // Diretório para salvar imagens
	},
	filename: function (req, file, cb) {
		cb(null, Date.now() + "-" + file.originalname); // Nome único para o arquivo
	},
});

// Validação do tipo de arquivo (apenas imagens)
const fileFilter = (req, file, cb) => {
	const fileTypes = /jpeg|jpg|png|gif/; // Tipos de arquivo permitidos
	const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
	const mimetype = fileTypes.test(file.mimetype);

	if (extname && mimetype) {
		return cb(null, true); // Se for imagem, permite o upload
	} else {
		cb(new Error("Apenas imagens (jpg, jpeg, png, gif) são permitidas"), false); // Caso contrário, rejeita
	}
};

// Definir o upload com as configurações de tamanho e tipo de arquivo
const upload = multer({
	storage: storage,
	limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB por imagem
	fileFilter: fileFilter,
});

// Servir arquivos estáticos do frontend
app.use(express.json());
app.use(express.static(path.join(__dirname, "../"))); // Serve os arquivos do diretório raiz do projeto

// Rota para enviar uma denúncia
app.post("/api/denuncia", upload.single("imagem"), (req, res) => {
    console.log("Requisição recebida no backend:");
    console.log("Método:", req.method);
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    console.log("File:", req.file);

    const { descricao, local } = req.body;
    const imagem = req.file ? req.file.filename : null;

    if (!descricao || !local) {
        return res.status(400).json({ message: "Campos obrigatórios não preenchidos." });
    }

    const novaDenuncia = new Denuncia({
        descricao,
        local,
        imagem,
    });

    novaDenuncia
        .save()
        .then(() =>
            res.status(201).json({
                message: "Denúncia registrada com sucesso!",
                data: novaDenuncia,
            })
        )
        .catch((err) => {
            console.error("Erro ao salvar no banco de dados:", err);
            res.status(500).json({ message: "Erro interno no servidor", error: err });
        });
});



// Rota para listar todas as denúncias
app.get("/api/denuncias", (req, res) => {
	Denuncia.find()
		.then((denuncias) => res.json(denuncias))
		.catch((err) =>
			res.status(400).json({ message: "Erro ao obter denúncias", error: err })
		);
});

// Rota para servir o arquivo HTML principal
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../index.html"));
});

// Iniciar o servidor
const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

