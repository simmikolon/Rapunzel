//
//  CollectableEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 29.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

enum CollectableEntityAnimationName: String {
    
    case Normal = "RPCollectableEntityNormal"
    
    static let atlasNames = [
        Normal.rawValue
    ]
}

class CollectableEntity: PlatformEntity, ResourceLoadableType {
    
    // MARK: - Properties
    
    static var animations: [String: Animation]!
    
    fileprivate lazy var _states: [State] = {
        return [
            CollectableEntityState(entity: self)
        ]
    }()
    
    override func states() -> [State] {
        return _states
    }
    
    // MARK: - Initialisation
    
    init(isBreakable breakable: Bool, isBottomCollidable bottomCollidable: Bool) {
        
        guard let animations = CollectableEntity.animations else {
            fatalError()
        }
        
        super.init(isBreakable: breakable, isBottomCollidable: bottomCollidable, animations: animations)
        
        /* Prototyping */
        
        self.animationComponent.node.size = CGSize(width: 32, height: 32)
        let colliderType: ColliderType = ColliderType.CollectableEntity
        let physicsComponent = PhysicsComponent(physicsBody: SKPhysicsBody(rectangleOf: CGSize(width: 32, height: 32)), colliderType: colliderType)
        self.addComponent(physicsComponent)
        self.renderComponent.node.physicsBody = physicsComponent.physicsBody
        
        self.animationComponent.requestedAnimation = CollectableEntityAnimationName.Normal.rawValue
    }
    
    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
}

extension CollectableEntity {
    
    static var resourcesNeedLoading: Bool {
        return animations == nil
    }
    
    static func loadResources(withCompletionHandler completionHandler: @escaping () -> ()) {
        
        SKTextureAtlas.preloadTextureAtlasesNamed(CollectableEntityAnimationName.atlasNames) { error, atlases in
            
            if let error = error { fatalError("Fatal Error beim Preloading der TextureAtlases: \(error)") }
            
            animations = [:]
            
            animations[CollectableEntityAnimationName.Normal.rawValue] = AnimationComponent.animationsFromAtlas(atlases[0])
            
            completionHandler()
        }
    }
    
    static func purgeResources() {
        
        animations = nil
    }
    
}
