// Importa el hook personalizado useAuth para acceder al contexto de autenticación
import { useAuth } from "../context/AuthContext";  // ✅ Asegúrate de que la ruta es correcta

// Importa el hook useState de React para gestionar el estado del componente
import { useState } from "react";

// Importa el hook useNavigate de React Router para navegar entre páginas
import { useNavigate } from "react-router-dom";

// Importa la librería axios para hacer solicitudes HTTP
import axios from "axios";

// Definición del componente Login
const Login = () => {
    // Desestructura la función login del contexto de autenticación (AuthContext)
    const { login } = useAuth(); // ✅ Usa useAuth sin problemas
    
    // Estado local para almacenar el valor del campo de nombre de usuario
    const [username, setUsername] = useState("");
    
    // Estado local para almacenar el valor del campo de la contraseña
    const [password, setPassword] = useState("");
    
    // Hook de React Router para navegar a diferentes rutas dentro de la aplicación
    const navigate = useNavigate();

    // Función que se ejecuta cuando el formulario es enviado
    const handleLogin = async (e) => {
        e.preventDefault();  // Prevenir el comportamiento por defecto del formulario (recarga de la página)
        
        try {
            // Intenta iniciar sesión utilizando el hook login que fue extraído del contexto AuthContext
            await login(username, password);
            
            // Si el login es exitoso, navega a la ruta "/profile"
            navigate("/profile");
        } catch (error) {
            // Si ocurre un error, muestra un mensaje de error en la consola
            console.error("Error en el inicio de sesión", error);
        }
    };

    // Renderiza el componente Login
    return (
        <div>
            <h2>Iniciar Sesión</h2>  {/* Título del formulario */}
            <form onSubmit={handleLogin}>  {/* Formulario para ingresar los datos de inicio de sesión */}
                <input 
                    type="text"  // Campo de entrada para el nombre de usuario
                    placeholder="Usuario"  // Texto de ayuda en el campo
                    value={username}  // El valor del campo se establece con el estado 'username'
                    onChange={(e) => setUsername(e.target.value)}  // Cuando el valor cambia, actualiza el estado 'username'
                />
                <input 
                    type="password"  // Campo de entrada para la contraseña
                    placeholder="Contraseña"  // Texto de ayuda en el campo
                    value={password}  // El valor del campo se establece con el estado 'password'
                    onChange={(e) => setPassword(e.target.value)}  // Cuando el valor cambia, actualiza el estado 'password'
                />
                <button type="submit">Entrar</button>  {/* Botón para enviar el formulario */}
            </form>
        </div>
    );
};

// Exporta el componente Login para que pueda ser utilizado en otras partes de la aplicación
export default Login;
