import RegisterForm from '../../components/Forms/RegisterForm/RegisterForm';
import Header from '../../components/Header/Header';
import './Register.scss';

function Register(){
    return(
        <div className="main register">
            <Header />
            <div className="register-container">
                <RegisterForm />
            </div>
            <div className="footer"></div>
        </div>
    );
}

export default Register;