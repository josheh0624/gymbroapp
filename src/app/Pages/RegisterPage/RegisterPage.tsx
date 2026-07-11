import { useAuth } from "@/app/Context/useAuth";
import { yupResolver } from "@hookform/resolvers/yup";
import { Stack } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import * as Yup from "yup";

type Props = {}

type RegisterFormsInputs = {
    email: string;
    username: string;
    password: string;
};

const validation = Yup.object().shape({
    email: Yup.string().email("Invalid email").required("Email is required"),
    username: Yup.string().required("Username is required"),
    password: Yup.string().required("Password is required"),
});

const RegisterPage = (props: Props) => {
    
    const {registerUser} = useAuth();
        const {
        control,
        handleSubmit,
        formState: {errors},
        } = useForm<RegisterFormsInputs>({
            resolver: yupResolver(validation)
    });
    
    const handleRegister = (form: RegisterFormsInputs) => {
        registerUser(form.email, form.username, form.password);
    };
    
    return (
        <>
        <Stack.Screen
            options={{
                headerShown: false,
            }}
        />

        <View style={styles.container}>
            <View style={styles.card}>

                <Text style={styles.title}>
                    Register
                </Text>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>
                        Email
                    </Text>

                    <Controller
                        control={control}
                        name="email"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                style={styles.input}
                                placeholder="Email"
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                                autoCapitalize="none"
                            />
                        )}
                    />

                    {errors.email && (
                        <Text style={styles.error}>
                            {errors.email.message}
                        </Text>
                    )}
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>
                        Username
                    </Text>

                    <Controller
                        control={control}
                        name="username"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                style={styles.input}
                                placeholder="Username"
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                                autoCapitalize="none"
                            />
                        )}
                    />

                    {errors.username && (
                        <Text style={styles.error}>
                            {errors.username.message}
                        </Text>
                    )}
                </View>


                <View style={styles.inputContainer}>
                    <Text style={styles.label}>
                        Password
                    </Text>

                    <Controller
                        control={control}
                        name="password"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                secureTextEntry
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                            />
                        )}
                    />

                    {errors.password && (
                        <Text style={styles.error}>
                            {errors.password.message}
                        </Text>
                    )}
                </View>


                <Pressable>
                    <Text style={styles.link}>
                        Forgot password?
                    </Text>
                </Pressable>


                <Pressable
                    style={styles.button}
                    onPress={handleSubmit(handleRegister)}
                >
                    <Text style={styles.buttonText}>
                        Sign in
                    </Text>
                </Pressable>


                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Don't have an account yet?{" "}
                    </Text>

                    <Pressable>
                        <Text style={styles.link}>
                            Sign up
                        </Text>
                    </Pressable>
                </View>

            </View>
        </View>
    </> 
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#25292e',
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
    },

    card: {
        width: "100%",
        backgroundColor: "#ffffff",
        borderRadius: 12,
        padding: 24,

        // Android shadow
        elevation: 5,

        // iOS shadow
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },

    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 24,
    },

    inputContainer: {
        marginBottom: 16,
    },

    label: {
        fontSize: 14,
        fontWeight: "500",
        color: "#111827",
        marginBottom: 8,
    },

    input: {
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 8,
        padding: 12,
        color: "#111827",
    },

    error: {
        color: "#ef4444",
        marginTop: 4,
        fontSize: 14,
    },

    link: {
        color: "#2563eb",
        fontSize: 14,
        fontWeight: "500",
        marginBottom: 16,
    },

    button: {
        backgroundColor: "#2563eb",
        borderRadius: 8,
        padding: 12,
        alignItems: "center",
    },

    buttonText: {
        color: "#ffffff",
        fontWeight: "700",
        fontSize: 16,
    },

    footer: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 20,
    },

    footerText: {
        color: "#6b7280",
        fontSize: 14,
    },
});

export default RegisterPage;