cmake_minimum_required (VERSION 3.11)
include (FetchContent)

project (hyperopt)

set (CMAKE_POSITION_INDEPENDENT_CODE ON)

# Fetch dlib
FetchContent_Declare (dlib
    FETCHCONTENT_QUIET OFF
    URL https://github.com/davisking/dlib/archive/v19.17.tar.gz
    URL_HASH SHA256=9d2a158b2adad6acba2346f90d929558a691151aa076a0b409ee685534118692
)

if (NOT dlib_POPULATED)
    # Populate dlib and switch off unused features
    option (DLIB_NO_GUI_SUPPORT "" ON)
    option (DLIB_USE_CUDA "" OFF)
    option (DLIB_PNG_SUPPORT "" OFF)
    option (DLIB_JPEG_SUPPORT "" OFF)
    option (DLIB_GIF_SUPPORT "" OFF)
    option (DLIB_LINK_WITH_SQLITE3 "" OFF)

    FetchContent_Populate (dlib)
    add_subdirectory (${dlib_SOURCE_DIR} ${dlib_BINARY_DIR})
endif ()

# Essential include files to build a node addon with cmake.js
include_directories (${CMAKE_JS_INC})

add_library (${PROJECT_NAME} SHARED "src/addon.cc")
set_target_properties (${PROJECT_NAME} PROPERTIES PREFIX "" SUFFIX ".node")

# Find the N-API wrappers
execute_process (
    COMMAND node -e "process.stdout.write(require('node-addon-api').include.replace(/^\"|\"+$/g, ''))"
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    OUTPUT_VARIABLE NODE_ADDON_API_DIR
)

# Include N-API wrappers
target_include_directories (${PROJECT_NAME}
    PRIVATE "${NODE_ADDON_API_DIR}"
)

# Essential library files to link to a node addon,
# you should add this line in every CMake.js based project.
target_link_libraries (${PROJECT_NAME} ${CMAKE_JS_LIB} dlib::dlib)
