//
//  WindowPlatformEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 29.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

enum WindowPlatformAnimationName: String {
    
    case Normal = "RPWindowNormal"
    case JumpingOn = "RPWindowJumpingOn"
    case JumpingOff = "RPWindowJumpingOff"
    case BottomHit = "RPWindowBottomHit"
    case EnemyAppearing = "RPWindowEnemyAppearing"
    
    static let atlasNames = [
        
        Normal.rawValue,
        JumpingOn.rawValue,
        JumpingOff.rawValue,
        BottomHit.rawValue,
        EnemyAppearing.rawValue
    ]
}

class WindowPlatformEntity: PlatformEntity, ResourceLoadableType {
    
    static var animations: [String: Animation]!
    
    fileprivate lazy var _states: [State] = {
       
        return [
            WindowIdleState(entity: self),
            WindowEnemyAppearingState(entity: self)
        ]
    }()
    
    override func states() -> [State] {
        return _states
    }
    
    init(isBreakable breakable: Bool, isBottomCollidable bottomCollidable: Bool) {
        
        guard let animations = WindowPlatformEntity.animations else {
            fatalError()
        }
        
        super.init(isBreakable: breakable, isBottomCollidable: bottomCollidable, animations: animations)
        
        //let debugComponent = DebugOutputComponent(withEntity: self, andName: "BranchPlatform")
        //self.addComponent(debugComponent)
        
        /* Prototyping */
        
        self.animationComponent.node.size = CGSize(width: 116, height: 120)
        
        let colliderType: ColliderType = (self.bottomCollidable) ? .BottomCollidablePlatform : .NormalPlatform
        let physicsComponent = PhysicsComponent(physicsBody: SKPhysicsBody(rectangleOf: CGSize(width: 116, height: 16)), colliderType: colliderType)
        self.addComponent(physicsComponent)
        self.renderComponent.node.physicsBody = physicsComponent.physicsBody
    }
    
    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
}

extension WindowPlatformEntity {
    
    static var resourcesNeedLoading: Bool {
        
        return animations == nil
    }
    
    static func loadResources(withCompletionHandler completionHandler: @escaping () -> ()) {
        
        SKTextureAtlas.preloadTextureAtlasesNamed(WindowPlatformAnimationName.atlasNames) { error, atlases in
            
            if let error = error { fatalError("Fatal Error beim Preloading der TextureAtlases: \(error)") }
            
            animations = [:]
            
            var index = 0
            
            for animationName in WindowPlatformAnimationName.atlasNames {
                
                animations[animationName] = AnimationComponent.animationsFromAtlas(atlases[index])
                index += 1
            }
            
            completionHandler()
        }
    }
    
    static func purgeResources() {
        
        animations = nil
    }
}
