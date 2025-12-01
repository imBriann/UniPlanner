"""
API REST con Flask para Sistema Académico Unipamplona
Backend para aplicación React Native
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import jwt
import os
from functools import wraps

# Importar modelos
from poo_models_sqlite import Usuario, Curso, Tarea, CalendarioInstitucional
from recomendaciones_funcional import (
    generar_recomendaciones,
    calcular_carga_semanal,
    calcular_estadisticas_funcionales,
    obtener_tareas_urgentes,
    generar_plan_estudio
)

# Configuración
app = Flask(__name__)
CORS(app)  # Permitir peticiones desde React Native
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['JSON_AS_ASCII'] = False  # Para soportar caracteres especiales

# ========== AUTENTICACIÓN JWT ==========

def generar_token(usuario_id: int) -> str:
    """Genera un token JWT para el usuario"""
    payload = {
        'user_id': usuario_id,
        'exp': datetime.utcnow() + timedelta(days=30)  # Token válido por 30 días
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

def token_requerido(f):
    """Decorator para endpoints que requieren autenticación"""
    @wraps(f)
    def decorador(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token no proporcionado'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            usuario_id = data['user_id']
            
            # Verificar que el usuario existe
            usuario = Usuario.obtener_por_id(usuario_id)
            if not usuario:
                return jsonify({'error': 'Usuario no encontrado'}), 401
            
            # Pasar usuario al endpoint
            return f(usuario, *args, **kwargs)
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expirado'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token inválido'}), 401
    
    return decorador


# ========== ENDPOINTS DE AUTENTICACIÓN ==========

@app.route('/api/auth/registro', methods=['POST'])
def registro():
    """
    POST /api/auth/registro
    Body: {
        nombre, apellido, email, password,
        semestre_actual, tipo_estudio,
        materias_aprobadas: [codigos],
        materias_cursando: [codigos]
    }
    """
    try:
        data = request.get_json()
        
        # Validar campos requeridos
        campos_requeridos = ['nombre', 'apellido', 'email', 'password', 
                            'semestre_actual', 'tipo_estudio']
        for campo in campos_requeridos:
            if campo not in data:
                return jsonify({'error': f'Campo requerido: {campo}'}), 400
        
        # Validar tipo de estudio
        if data['tipo_estudio'] not in ['intensivo', 'moderado', 'leve']:
            return jsonify({'error': 'tipo_estudio debe ser: intensivo, moderado o leve'}), 400
        
        # Crear usuario
        usuario = Usuario.crear(
            nombre=data['nombre'],
            apellido=data['apellido'],
            email=data['email'],
            password=data['password'],
            semestre_actual=int(data['semestre_actual']),
            tipo_estudio=data['tipo_estudio'],
            materias_aprobadas=data.get('materias_aprobadas', []),
            materias_cursando=data.get('materias_cursando', [])
        )
        
        # Generar token
        token = generar_token(usuario.id)
        
        return jsonify({
            'success': True,
            'mensaje': 'Usuario registrado exitosamente',
            'token': token,
            'usuario': {
                'id': usuario.id,
                'nombre': usuario.nombre,
                'apellido': usuario.apellido,
                'email': usuario.email,
                'nombre_completo': usuario.nombre_completo,
                'semestre_actual': usuario.semestre_actual,
                'tipo_estudio': usuario.tipo_estudio
            }
        }), 201
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Error interno del servidor'}), 500


# En flask_api.py

@app.route('/api/auth/login', methods=['POST'])
def login():
    """
    POST /api/auth/login
    Body: { email, password }
    """
    try:
        data = request.get_json()
        print(f"📩 Intento de login: {data.get('email')}") # LOG DE DEPURACIÓN
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email y contraseña requeridos'}), 400
        
        usuario = Usuario.autenticar(data['email'], data['password'])
        
        if not usuario:
            print("❌ Usuario no encontrado o contraseña incorrecta")
            return jsonify({'error': 'Credenciales incorrectas'}), 401
        
        print(f"✅ Usuario encontrado: {usuario.id}")
        
        # Generar token
        token = generar_token(usuario.id)
        
        # --- CORRECCIÓN IMPORTANTE ---
        # Si el token es de tipo 'bytes', lo convertimos a 'string'
        if isinstance(token, bytes):
            token = token.decode('utf-8')
        
        print(f"🔑 Token generado: {token[:10]}...") 
        
        return jsonify({
            'success': True,
            'token': token,
            'usuario': {
                'id': usuario.id,
                'nombre': usuario.nombre,
                'apellido': usuario.apellido,
                'email': usuario.email,
                'nombre_completo': usuario.nombre_completo,
                'semestre_actual': usuario.semestre_actual,
                'tipo_estudio': usuario.tipo_estudio
            }
        }), 200
        
    except Exception as e:
        # ESTO ES LO MÁS IMPORTANTE: Imprimir el error real en la terminal
        import traceback
        traceback.print_exc()
        print(f"🔥 ERROR CRÍTICO: {str(e)}")
        return jsonify({'error': f'Error interno: {str(e)}'}), 500

# ========== ENDPOINTS DE CURSOS ==========

@app.route('/api/cursos', methods=['GET'])
def obtener_cursos():
    """GET /api/cursos?semestre=1"""
    semestre = request.args.get('semestre', type=int)
    
    if semestre:
        cursos = Curso.obtener_por_semestre(semestre)
    else:
        cursos = Curso.obtener_todos()
    
    return jsonify({
        'cursos': [{
            'codigo': c.codigo,
            'nombre': c.nombre,
            'creditos': c.creditos,
            'semestre': c.semestre,
            'requisitos': c.requisitos
        } for c in cursos]
    })


@app.route('/api/cursos/<codigo>', methods=['GET'])
def obtener_curso(codigo):
    """GET /api/cursos/{codigo}"""
    curso = Curso.obtener_por_codigo(codigo)
    
    if not curso:
        return jsonify({'error': 'Curso no encontrado'}), 404
    
    return jsonify({
        'codigo': curso.codigo,
        'nombre': curso.nombre,
        'creditos': curso.creditos,
        'semestre': curso.semestre,
        'iit': curso.iit,
        'hp': curso.hp,
        'requisitos': curso.requisitos
    })


@app.route('/api/cursos/buscar', methods=['GET'])
def buscar_cursos():
    """GET /api/cursos/buscar?q=programacion"""
    termino = request.args.get('q', '')
    
    if not termino:
        return jsonify({'error': 'Parámetro q requerido'}), 400
    
    cursos = Curso.buscar(termino)
    
    return jsonify({
        'resultados': [{
            'codigo': c.codigo,
            'nombre': c.nombre,
            'creditos': c.creditos,
            'semestre': c.semestre
        } for c in cursos]
    })


# ========== ENDPOINTS DE USUARIO ==========

@app.route('/api/usuario/perfil', methods=['GET'])
@token_requerido
def obtener_perfil(usuario):
    """GET /api/usuario/perfil"""
    stats = usuario.obtener_estadisticas()
    config = usuario.obtener_configuracion_estudio()
    
    return jsonify({
        'usuario': {
            'id': usuario.id,
            'nombre': usuario.nombre,
            'apellido': usuario.apellido,
            'email': usuario.email,
            'nombre_completo': usuario.nombre_completo,
            'semestre_actual': usuario.semestre_actual,
            'tipo_estudio': usuario.tipo_estudio
        },
        'estadisticas': stats,
        'configuracion_estudio': config
    })


@app.route('/api/usuario/materias/actuales', methods=['GET'])
@token_requerido
def obtener_materias_actuales(usuario):
    """GET /api/usuario/materias/actuales"""
    materias = usuario.obtener_materias_actuales()
    
    return jsonify({
        'materias': [{
            'codigo': m.codigo,
            'nombre': m.nombre,
            'creditos': m.creditos,
            'semestre': m.semestre
        } for m in materias]
    })


@app.route('/api/usuario/materias/aprobadas', methods=['GET'])
@token_requerido
def obtener_materias_aprobadas(usuario):
    """GET /api/usuario/materias/aprobadas"""
    materias = usuario.obtener_materias_aprobadas()
    
    return jsonify({
        'materias': [{
            'codigo': m.codigo,
            'nombre': m.nombre,
            'creditos': m.creditos,
            'semestre': m.semestre
        } for m in materias]
    })


@app.route('/api/usuario/materias/inscribir', methods=['POST'])
@token_requerido
def inscribir_materia(usuario):
    """POST /api/usuario/materias/inscribir
    Body: { codigo_materia }
    """
    data = request.get_json()
    codigo = data.get('codigo_materia')
    
    if not codigo:
        return jsonify({'error': 'codigo_materia requerido'}), 400
    
    try:
        usuario.inscribir_materia(codigo)
        return jsonify({'success': True, 'mensaje': 'Materia inscrita'}), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400


@app.route('/api/usuario/materias/cancelar', methods=['POST'])
@token_requerido
def cancelar_materia(usuario):
    """POST /api/usuario/materias/cancelar
    Body: { codigo_materia }
    """
    data = request.get_json()
    codigo = data.get('codigo_materia')
    
    if not codigo:
        return jsonify({'error': 'codigo_materia requerido'}), 400
    
    if usuario.cancelar_materia(codigo):
        return jsonify({'success': True, 'mensaje': 'Materia cancelada'}), 200
    else:
        return jsonify({'error': 'No se pudo cancelar la materia'}), 400


# ========== ENDPOINTS DE TAREAS ==========

@app.route('/api/tareas', methods=['GET'])
@token_requerido
def obtener_tareas(usuario):
    """GET /api/tareas?pendientes=true"""
    solo_pendientes = request.args.get('pendientes', 'false').lower() == 'true'
    
    tareas = usuario.obtener_tareas(solo_pendientes=solo_pendientes)
    
    return jsonify({
        'tareas': [{
            'id': t.id,
            'titulo': t.titulo,
            'descripcion': t.descripcion,
            'tipo': t.tipo,
            'curso': {
                'codigo': t.curso.codigo,
                'nombre': t.curso.nombre,
                'creditos': t.curso.creditos
            },
            'fecha_limite': t.fecha_limite.isoformat(),
            'hora_limite': t.hora_limite,
            'horas_estimadas': t.horas_estimadas,
            'dificultad': t.dificultad,
            'prioridad': t.prioridad,
            'completada': t.completada,
            'porcentaje_completado': t.porcentaje_completado,
            'dias_restantes': t.dias_restantes()
        } for t in tareas]
    })


@app.route('/api/tareas', methods=['POST'])
@token_requerido
def crear_tarea(usuario):
    """
    POST /api/tareas
    Body: {
        curso_codigo, titulo, tipo, fecha_limite,
        horas_estimadas, dificultad,
        descripcion (opcional), hora_limite (opcional)
    }
    """
    try:
        data = request.get_json()
        
        campos_requeridos = ['curso_codigo', 'titulo', 'tipo', 
                            'fecha_limite', 'horas_estimadas', 'dificultad']
        for campo in campos_requeridos:
            if campo not in data:
                return jsonify({'error': f'Campo requerido: {campo}'}), 400
        
        tarea = usuario.agregar_tarea(
            curso_codigo=data['curso_codigo'],
            titulo=data['titulo'],
            tipo=data['tipo'],
            fecha_limite=data['fecha_limite'],
            horas_estimadas=float(data['horas_estimadas']),
            dificultad=int(data['dificultad']),
            descripcion=data.get('descripcion', ''),
            hora_limite=data.get('hora_limite')
        )
        
        return jsonify({
            'success': True,
            'tarea': {
                'id': tarea.id,
                'titulo': tarea.titulo,
                'curso': tarea.curso.nombre
            }
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@app.route('/api/tareas/<int:tarea_id>', methods=['DELETE'])
@token_requerido
def eliminar_tarea(usuario, tarea_id):
    """DELETE /api/tareas/{id}"""
    tarea = Tarea.obtener_por_id(tarea_id)
    
    if not tarea or tarea.usuario_id != usuario.id:
        return jsonify({'error': 'Tarea no encontrada'}), 404
    
    tarea.eliminar()
    return jsonify({'success': True, 'mensaje': 'Tarea eliminada'}), 200


@app.route('/api/tareas/<int:tarea_id>/completar', methods=['POST'])
@token_requerido
def completar_tarea(usuario, tarea_id):
    """POST /api/tareas/{id}/completar
    Body: { porcentaje } (opcional, default 100)
    """
    tarea = Tarea.obtener_por_id(tarea_id)
    
    if not tarea or tarea.usuario_id != usuario.id:
        return jsonify({'error': 'Tarea no encontrada'}), 404
    
    data = request.get_json() or {}
    porcentaje = data.get('porcentaje', 100)
    
    tarea.marcar_completada(porcentaje)
    return jsonify({'success': True, 'mensaje': 'Tarea completada'}), 200


@app.route('/api/tareas/<int:tarea_id>/progreso', methods=['POST'])
@token_requerido
def actualizar_progreso(usuario, tarea_id):
    """POST /api/tareas/{id}/progreso
    Body: { porcentaje }
    """
    tarea = Tarea.obtener_por_id(tarea_id)
    
    if not tarea or tarea.usuario_id != usuario.id:
        return jsonify({'error': 'Tarea no encontrada'}), 404
    
    data = request.get_json()
    porcentaje = data.get('porcentaje')
    
    if porcentaje is None:
        return jsonify({'error': 'porcentaje requerido'}), 400
    
    tarea.actualizar_progreso(int(porcentaje))
    return jsonify({'success': True}), 200


# ========== ENDPOINTS DE RECOMENDACIONES ==========

@app.route('/api/recomendaciones', methods=['GET'])
@token_requerido
def obtener_recomendaciones(usuario):
    """GET /api/recomendaciones?limite=5"""
    limite = request.args.get('limite', 5, type=int)
    
    tareas = usuario.obtener_tareas(solo_pendientes=True)
    recomendaciones = generar_recomendaciones(tareas, limite=limite)
    
    return jsonify({
        'recomendaciones': [{
            'id': t.id,
            'titulo': t.titulo,
            'curso': t.curso.nombre,
            'fecha_limite': t.fecha_limite.isoformat(),
            'dias_restantes': t.dias_restantes(),
            'horas_estimadas': t.horas_estimadas,
            'dificultad': t.dificultad
        } for t in recomendaciones]
    })


@app.route('/api/recomendaciones/carga-semanal', methods=['GET'])
@token_requerido
def obtener_carga_semanal(usuario):
    """GET /api/recomendaciones/carga-semanal"""
    tareas = usuario.obtener_tareas(solo_pendientes=True)
    carga = calcular_carga_semanal(tareas)
    
    return jsonify({'carga_semanal': carga})


@app.route('/api/recomendaciones/tareas-urgentes', methods=['GET'])
@token_requerido
def obtener_urgentes(usuario):
    """GET /api/recomendaciones/tareas-urgentes?dias=3"""
    dias = request.args.get('dias', 3, type=int)
    
    tareas = usuario.obtener_tareas(solo_pendientes=True)
    urgentes = obtener_tareas_urgentes(tareas, dias_umbral=dias)
    
    return jsonify({
        'tareas_urgentes': [{
            'id': t.id,
            'titulo': t.titulo,
            'curso': t.curso.nombre,
            'fecha_limite': t.fecha_limite.isoformat(),
            'dias_restantes': t.dias_restantes()
        } for t in urgentes]
    })


@app.route('/api/recomendaciones/plan-estudio', methods=['GET'])
@token_requerido
def obtener_plan_estudio(usuario):
    """GET /api/recomendaciones/plan-estudio"""
    tareas = usuario.obtener_tareas(solo_pendientes=True)
    config = usuario.obtener_configuracion_estudio()
    
    plan = generar_plan_estudio(tareas, config['horas_diarias'])
    
    return jsonify({
        'plan': [{
            'fecha': dia['fecha'].isoformat(),
            'horas_totales': dia['horas_totales'],
            'tareas': [{
                'id': t.id,
                'titulo': t.titulo,
                'curso': t.curso.nombre,
                'horas_estimadas': t.horas_estimadas
            } for t in dia['tareas']]
        } for dia in plan]
    })


@app.route('/api/estadisticas', methods=['GET'])
@token_requerido
def obtener_estadisticas(usuario):
    """GET /api/estadisticas"""
    tareas = usuario.obtener_tareas()
    stats_funcionales = calcular_estadisticas_funcionales(tareas)
    stats_usuario = usuario.obtener_estadisticas()
    
    return jsonify({
        'estadisticas': {
            **stats_funcionales,
            **stats_usuario
        }
    })


# ========== ENDPOINTS DE CALENDARIO ==========

@app.route('/api/calendario/eventos', methods=['GET'])
def obtener_eventos_calendario():
    """GET /api/calendario/eventos?semestre=2025-1"""
    semestre = request.args.get('semestre')
    
    if semestre:
        eventos = CalendarioInstitucional.obtener_por_semestre(semestre)
    else:
        eventos = CalendarioInstitucional.obtener_proximos(dias=90)
    
    return jsonify({
        'eventos': [{
            'id': e.id,
            'nombre': e.nombre_evento,
            'descripcion': e.descripcion,
            'fecha_inicio': e.fecha_inicio.isoformat(),
            'fecha_fin': e.fecha_fin.isoformat() if e.fecha_fin else None,
            'tipo': e.tipo,
            'semestre': e.semestre,
            'icono': e.icono,
            'color': e.color
        } for e in eventos]
    })


# ========== HEALTH CHECK ==========

@app.route('/api/health', methods=['GET'])
def health_check():
    """GET /api/health - Verifica que la API está funcionando"""
    return jsonify({
        'status': 'ok',
        'mensaje': 'API funcionando correctamente',
        'version': '1.0.0'
    })


# ========== ERROR HANDLERS ==========

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint no encontrado'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Error interno del servidor'}), 500


# ========== MAIN ==========

if __name__ == '__main__':
    print("🚀 Iniciando API REST - Sistema Académico Unipamplona")
    print("=" * 70)
    print("📡 Servidor corriendo en: http://localhost:5000")
    print("📚 Documentación: http://localhost:5000/api/health")
    print("=" * 70)
    
    app.run(debug=True, host='0.0.0.0', port=5000)