import sqlite3

def actualizar_email():
    print("🔄 Actualizando usuario de prueba...")
    
    # Conectamos a la base de datos
    conn = sqlite3.connect('BaseUniPlanner.db')
    cursor = conn.cursor()
    
    try:
        # Cambiamos 'estudiante' por un correo real
        cursor.execute('''
        UPDATE usuarios 
        SET email = 'estudiante@unipamplona.edu.co' 
        WHERE email = 'estudiante'
        ''')
        
        if cursor.rowcount > 0:
            print("✅ ¡Listo! El usuario 'estudiante' ahora es 'estudiante@unipamplona.edu.co'")
            print("🔑 La contraseña sigue siendo: 1234")
        else:
            print("⚠️ No se encontró al usuario 'estudiante'. Quizás ya lo actualizaste.")
            
        conn.commit()
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    actualizar_email()