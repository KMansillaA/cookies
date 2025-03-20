// Importa el hook personalizado useAuth para acceder al contexto de autenticación
import { useAuth } from "../context/AuthContext";

// Importa el hook useNavigate de React Router para navegar entre páginas
import { useNavigate } from "react-router-dom";

// Definición del componente Profile
const Profile = () => {
    // Desestructura las propiedades 'user' y 'logout' del contexto de autenticación
    const { user, logout } = useAuth();

    // Si no hay un usuario autenticado, muestra un mensaje de carga
    if (!user) return <p>Cargando...</p>;

    // Renderiza el componente Profile
    return (
        <div>
            <h2>Perfil</h2>  {/* Título de la página de perfil */}
            <p>Bienvenido, {user.username}</p>  {/* Muestra el nombre de usuario del usuario autenticado */}
            
            {/* Botón para cerrar sesión */}
            <button onClick={() => { 
                logout();  // Llama a la función logout del contexto para cerrar sesión
                navigate("/");  // Redirige al usuario a la página de inicio después de cerrar sesión
            }}>
                Cerrar sesión
            </button>
        </div>
    );
};

// Exporta el componente Profile para que pueda ser utilizado en otras partes de la aplicación
export default Profile;
