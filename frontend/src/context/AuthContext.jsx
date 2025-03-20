// Importación de hooks de React y la librería axios para hacer peticiones HTTP
import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

// Crear el contexto de autenticación (AuthContext)
const AuthContext = createContext();

// Componente proveedor de autenticación que envuelve a sus hijos y proporciona el contexto
export const AuthProvider = ({ children }) => {
    // Estado local para almacenar la información del usuario autenticado
    const [user, setUser] = useState(null);

    // Función para verificar si el usuario está autenticado
    const checkAuth = async () => {
        try {
            // Realiza una solicitud GET a la ruta /profile en el backend para obtener la información del usuario autenticado
            const res = await axios.get("http://localhost:5000/profile", { withCredentials: true });
            
            // Si la solicitud es exitosa, guarda la información del usuario en el estado
            setUser(res.data.user);
        } catch {
            // Si ocurre un error (por ejemplo, el usuario no está autenticado), establece el estado de usuario como null
            setUser(null);
        }
    };

    // useEffect se ejecuta una vez cuando el componente se monta
    // Llama a la función checkAuth para comprobar si el usuario está autenticado
    useEffect(() => {
        checkAuth();  // Llamar a checkAuth solo una vez al montar el componente
    }, []);  // El array vacío [] asegura que se ejecute solo al montar el componente

    // Función para iniciar sesión con el nombre de usuario y la contraseña
    const login = async (username, password) => {
        // Realiza una solicitud POST a la ruta /login en el backend con el nombre de usuario y la contraseña
        await axios.post("http://localhost:5000/login", { username, password }, { withCredentials: true });
        
        // Después de que el inicio de sesión sea exitoso, verifica el estado de autenticación
        await checkAuth();
    };

    // Función para cerrar sesión
    const logout = async () => {
        // Realiza una solicitud POST a la ruta /logout en el backend para cerrar la sesión
        await axios.post("http://localhost:5000/logout", {}, { withCredentials: true });
        
        // Borra la información del usuario en el estado local
        setUser(null);
    };

    // Devuelve el proveedor de contexto AuthContext, pasando el estado del usuario y las funciones login y logout
    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}  {/* Renderiza los componentes hijos que estén envueltos en este proveedor */}
        </AuthContext.Provider>
    );
};

// Exporta el hook useAuth para que otros componentes puedan acceder al contexto de autenticación
export const useAuth = () => useContext(AuthContext);
