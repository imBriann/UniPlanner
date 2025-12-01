from poo_models_sqlite import Usuario

def crear_usuario_demo():
    print("👤 Creando usuario de prueba...")
    try:
        # Intentamos crear el usuario 'estudiante' con contraseña '1234'
        usuario = Usuario.crear(
            nombre="Pepito",
            apellido="Pérez",
            email="estudiante",     # Este es el usuario que usaremos en el login
            password="1234",        # Esta es la contraseña
            semestre_actual=5,
            tipo_estudio="moderado",
            materias_aprobadas=["167392", "167394"], # Algunos códigos de ejemplo
            materias_cursando=["167401", "167402"]
        )
        print(f"✅ ¡Éxito! Usuario creado: {usuario.email} (Pass: 1234)")
        print("Ahora intenta loguearte desde el celular.")
        
    except ValueError as e:
        print(f"⚠️ Aviso: {e}") 
        print("(Probablemente el usuario ya existía. Intenta cambiar la contraseña en el script si la olvidaste)")

if __name__ == "__main__":
    crear_usuario_demo()