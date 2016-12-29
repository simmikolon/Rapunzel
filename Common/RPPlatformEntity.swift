//
//  PlatformEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 27.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

//import UIKit
import GameplayKit
import SpriteKit

enum PlatformAnimationName: String {
    
    case Normal = "RPPlatformLeftNormal"
    case JumpingOn = "RPPlatformLeftJumpingOn"
    case JumpingOff = "RPPlatformLeftJumpingOff"
    case BottomHit = "RPPlatformLeftBottomHit"
    
    static let atlasNames = [
        
        Normal.rawValue,
        JumpingOn.rawValue,
        JumpingOff.rawValue,
        BottomHit.rawValue
    ]
}

protocol PlatformEntityDelegate: class {
    func didRemovePlatform(platform: PlatformEntity)
}

class PlatformEntity: Entity, ContactNotifiableType, LifecycleComponentDelegate {
    
    static var textureSize = CGSize(width: 256, height: 128)
    
    // MARK: - Properties
    
    /* Our Delegate who needs to know whenever a Platform Entity has left the screen */
    
    weak var delegate: PlatformEntityDelegate?
    
    fileprivate lazy var _states: [State] = {
        
        /* States are being defined with lazy property which can be overriden when subclassing */
        /* This way we can safely use different states in subclasses without instanciating twice */
        
        return [
            
            PlatformNormalState(entity: self),
            PlatformJumpingOnState(entity: self),
            PlatformJumpingOffState(entity: self),
            PlatformBottomHitState(entity: self),
            PlatformBreakingState(entity: self)
        ]
    }()
    
    func states() -> [State] {
        
        /* We are accessing states with this function. When it is being called it forces the lazy */
        /* property and its content to be instantiated.  */
        
        return _states
    }
    
    // MARK: - Components
    
    let renderComponent: RenderComponent
    let physicsComponent: PhysicsComponent
    var stateMachineComponent: StateMachineComponent!
    let animationComponent: AnimationComponent
    
    // MARK: - Platform Configuration Variables
    
    var breakable: Bool
    var bottomCollidable: Bool
    
    // MARK: - Initialisation
    
    init(isBreakable breakable: Bool = false, isBottomCollidable bottomCollidable: Bool = false, animations: [String: Animation]) {
        
        /* Platform Configuration */
        
        self.breakable = breakable
        self.bottomCollidable = bottomCollidable
        
        /* Create Render Component */
        
        renderComponent = RenderComponent()

        /* Chose Collider Type based on self.bottomCollidable & create Physics Component */
        
        let colliderType: ColliderType = (self.bottomCollidable) ? .BottomCollidablePlatform : .NormalPlatform
        physicsComponent = PhysicsComponent(physicsBody: SKPhysicsBody(rectangleOf: CGSize(width: 256, height: 128)), colliderType: colliderType)
        
        /* Create Animation Component and take over the animations from self.init( . . .) */
        
        animationComponent = AnimationComponent(textureSize: PlatformEntity.textureSize, animations: animations)
        
        /* Add the Animation Components Node to the Render Components Node */
        
        renderComponent.addChild(animationComponent.node)
        
        /* We are ready to call super.init() */
        
        super.init()
        
        /* Set up all those things for which we need taking over self as a reference */
        
        /* Assign self to the Render Components Node Entity-Property. */
        /* Used among others for Collision Detection to forward Collision into this Entity */
        
        renderComponent.node.entity = self;
        
        /* Assign the Phyiscs Components Physicsbody to the Render Components Node */
        
        renderComponent.node.physicsBody = physicsComponent.physicsBody
        
        /* Set the initial Animation */
        
        //let animationNames = PlatformEntity.animationNames as! PlatformAnimationNames
        animationComponent.requestedAnimation = PlatformAnimationName.Normal.rawValue
        
        /* Initialization of the default classes State Machine Component and GKState Subclasses  */
        /* We need to carry over self into our State Machine Component so we need to Initialize this after calling super.init() */
        /* Since .stateMachineComponent being an optional we can Subclass PlatformEntity and assign a different State Machine */
        /* Doing this we can define individual States for individual Subclasses. */
        /* This can be done by simply overriding the 'self.states' property within a subclass */
        
        stateMachineComponent = StateMachineComponent(states: self.states())
        
        /* Setting up the initial State this Entity will be in after Initialization */
        
        stateMachineComponent.enterInitialState()
        
        /* All Components have to be added to this Entity */
        
        addComponent(physicsComponent)
        addComponent(renderComponent)
        addComponent(animationComponent)
        addComponent(stateMachineComponent)
        
        /* Lifecycle Component */
        
        let lifecycleComponent = LifecycleComponent(withEntity: self, delegate: self)
        addComponent(lifecycleComponent)
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    // MARK: - Management Functions
    
    func remove() {
        
        /* Removing all Actions, Nodes, Children and so on ... */
        
        self.animationComponent.node.removeFromParent()
        
        self.renderComponent.node.removeAllActions()
        self.renderComponent.node.removeAllChildren()
        self.renderComponent.node.removeFromParent()
        
        /* Remove all Components assigned to this Entity */
        
        //self.removeComponentForClass(RenderComponent)
        //self.removeComponentForClass(PhysicsComponent)
        //self.removeComponentForClass(AnimationComponent)
        //self.removeComponentForClass(StateMachineComponent)
        
        /* Inform Delegate that this Entity has just left */
        
        if let delegate = self.delegate {
            delegate.didRemovePlatform(platform: self)
        }
    }

    // MARK: Deinitialization
    
    deinit {
        
        /* Debug Output to see if Entity was deallocated properly */
        print("Deinitialization: \(type(of: self))")
    }
    
    // MARK: - LifecycleComponent
    
    func nodeDidExitScreen(_ node: SKNode) {
        
        remove()
    }
}

extension PlatformEntity {
    
    /* Forwarding Collision Even into State Machine Component */
    
    func contactWithEntityDidBegin(_ entity: GKEntity) {
        
        stateMachineComponent.contactWithEntityDidBegin(entity)
    }
    
    func contactWithEntityDidEnd(_ entity: GKEntity) {
        
        stateMachineComponent.contactWithEntityDidEnd(entity)
    }
}
