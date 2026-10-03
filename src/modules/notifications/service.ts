import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/providers/email";

export async function notifyUser(input:{userId:string;title:string;message:string;email?:boolean}){
  const row=await prisma.notification.create({data:{userId:input.userId,channel:'INTERNAL',title:input.title,message:input.message,status:'SENT',sentAt:new Date()}});
  if(input.email){
    const user=await prisma.user.findUnique({where:{id:input.userId}});
    if(user){
      try{
        const result=await sendEmail({to:user.email,subject:input.title,html:`<p>${input.message}</p>`});
        await prisma.notification.create({data:{userId:input.userId,channel:'EMAIL',title:input.title,message:input.message,status:result.sent?'SENT':'PENDING',sentAt:result.sent?new Date():null,errorCode:result.sent?null:(result.reason||'PROVIDER_DISABLED')}});
      }catch{
        await prisma.notification.create({data:{userId:input.userId,channel:'EMAIL',title:input.title,message:input.message,status:'FAILED',errorCode:'PROVIDER_ERROR'}});
      }
    }
  }
  return row;
}

export async function notifyStudentGuardians(studentId:string,title:string,message:string){
  const links=await prisma.studentGuardian.findMany({where:{studentId},include:{guardian:{include:{person:{include:{user:true}}}}}});
  for(const link of links){const user=link.guardian.person.user;if(user)await notifyUser({userId:user.id,title,message,email:true})}
}
